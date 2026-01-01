import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from 'src/model/user.entity';
import { Repository, FindOneOptions } from 'typeorm';
import { CreateUserDto } from './dtos/createuser.dto';
import { LoginUserDto } from './dtos/loginuser.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import jwt from "jsonwebtoken"
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/common/mail.service';
@Injectable()
export class UsersService {
    constructor(@InjectRepository(Users) private readonly usersRepository: Repository<Users>, private configService: ConfigService, private mailService: MailService) { }


    async register(createUserDto: CreateUserDto) {
        const { password, ...rest } = createUserDto;
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = this.usersRepository.create({
            ...rest,
            password: hashedPassword
        });

        const saved = await this.usersRepository.save(newUser);

        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

        saved.verificationTokenHash = tokenHash;
        saved.verificationTokenExpires = expires;
        await this.usersRepository.save(saved);

        await this.mailService.sendVerification(saved.email, token);

        return { id: saved.id, email: saved.email };
    }

    async findUserById(id: number) {
        const options: FindOneOptions<Users> = { where: { id } };
        return this.usersRepository.findOne(options);
    }


    async login(loginUserDto: LoginUserDto) {
        const { email, password } = loginUserDto;


        const user = await this.usersRepository.findOne({ where: { email } });
        if (!user) {
            throw new UnauthorizedException("Invalid credentials")
        }

        if (!user.isEmailVerified) {
            throw new UnauthorizedException("Please verify your email before logging in")
        }

        const correctPassword = await bcrypt.compare(password, user.password)
        if (!correctPassword) {
            throw new UnauthorizedException("Invalid credentials")
        }


        const token = this.generateJwtToken(email, user.id, user.firstName, user.lastName)
        return { token }
    }

    async verifyEmail(token: string) {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        // console.log(tokenHash)
        const user = await this.usersRepository.findOne({
            where: { verificationTokenHash: tokenHash }
        });

        if (!user) throw new NotFoundException('Invalid or expired token');
        if (!user.verificationTokenExpires || user.verificationTokenExpires < new Date())
            throw new BadRequestException('Token expired');

        user.isEmailVerified = true;
        user.verificationTokenHash = null;
        user.verificationTokenExpires = null;
        await this.usersRepository.save(user);

        return { ok: true, message: 'Email verified' };
    }

    async getProfile(userId: number){
        const user = await this.usersRepository.findOne({
            where: { id: userId },
            select: ['id', 'email', 'firstName', 'lastName', 'isEmailVerified'],
        });

        if (!user) throw new NotFoundException('User not found');

        return user;
    }

    async upsertGoogleUser(payload: { email?: string; given_name?: string; family_name?: string }) {
        const email = payload.email!;
        let user = await this.usersRepository.findOne({ where: { email } });
        if (user) return user;

        const randomPassword = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        user = this.usersRepository.create({
            email,
            password: hashedPassword,
            firstName: payload.given_name || '',
            lastName: payload.family_name || '',
            isEmailVerified: true,
        });

        return this.usersRepository.save(user);
    }

    createJwtForUser(user: Users) {
        return jwt.sign({ email: user.email, userId: user.id, firstName: user.firstName, lastName: user.lastName }, this.configService.get("SECRET")!, { expiresIn: "1h" })
    }

    private generateJwtToken(
        email: string,
        userId: number,
        firstName: string,
        lastName: string
    ) {
        return jwt.sign({ email, userId, firstName, lastName }, this.configService.get("SECRET")!, { expiresIn: "1h" })
    }
}
