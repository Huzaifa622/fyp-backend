import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from 'src/model/user.entity';
import { AuthGuard } from './auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from 'src/common/mail.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [ConfigModule, JwtModule.registerAsync({
    imports: [ConfigModule],
    useFactory: (configService: ConfigService) => ({
      secret: configService.get("SECRET"),
      signOptions: { expiresIn: "1h" }
    }),
    inject: [ConfigService]
  }), TypeOrmModule.forFeature([Users])],
  controllers: [UsersController, AuthController],
  providers: [UsersService,AuthGuard, MailService],
})
export class UsersModule { }
