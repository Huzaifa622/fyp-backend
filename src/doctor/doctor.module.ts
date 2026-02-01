import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from 'src/model/user.entity';
// import { AuthGuard } from './auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthMiddleware } from 'src/middleware/auth.middleware';
import { OnboardingMiddleware } from 'src/middleware/onboarding.middleware';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';
import { Doctors } from 'src/model/doctor.entity';
import { Patients } from 'src/model/patient.entity';
import { TimeSlots } from 'src/model/time-slot.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [
    CloudinaryModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Doctors, TimeSlots, Users, Patients]),
  ],
  controllers: [DoctorController],
  providers: [DoctorService],
})
export class DoctorModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(DoctorController);
    consumer
      .apply(OnboardingMiddleware)
      .exclude({ path: 'doctor/onboard', method: RequestMethod.POST })
      .forRoutes(DoctorController);
  }
}
