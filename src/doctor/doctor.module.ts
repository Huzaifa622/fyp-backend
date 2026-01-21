import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from 'src/model/user.entity';
// import { AuthGuard } from './auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from 'src/common/mail.service';
import { AuthMiddleware } from 'src/middleware/auth.middleware';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';


@Module({
  imports: [ConfigModule, JwtModule.registerAsync({
    imports: [ConfigModule],
    useFactory: (configService: ConfigService) => ({
      secret: configService.get("SECRET"),
      signOptions: { expiresIn: "1h" }
    }),
    inject: [ConfigService]
  }), TypeOrmModule.forFeature([Users])],
  controllers: [DoctorController],
  providers: [DoctorService, MailService], 
})
export class DoctorModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(DoctorController);
  }
}
