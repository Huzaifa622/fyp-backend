import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from 'src/model/user.entity';
import { Repository, FindOneOptions } from 'typeorm';
import { CreateUserDto } from './dtos/createuser.dto';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dtos/loginuser.dto';
import jwt from "jsonwebtoken"
import { ConfigService } from '@nestjs/config';
@Injectable()
export class UsersService {
    constructor(@InjectRepository(Users) private readonly usersRepository: Repository<Users>, private configService: ConfigService) { }


    async register(createUserDto: CreateUserDto) {
        const { password, ...rest } = createUserDto;

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = this.usersRepository.create({
            ...rest,
            password: hashedPassword
        });

        return this.usersRepository.save(newUser);
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

        const correctPassword = await bcrypt.compare(password, user.password)
        if (!correctPassword) {
            throw new UnauthorizedException("Invalid credentials")
        }


        const token = this.generateJwtToken(email, user.id, user.firstName, user.lastName)
        return { token }
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
