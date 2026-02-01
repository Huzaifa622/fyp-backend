import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientController } from './patient.controller';
import { PatientService } from './patient.service';
import { Patients } from 'src/model/patient.entity';
import { Doctors } from 'src/model/doctor.entity';
import { AIPatientGeneratedReport } from 'src/model/ai-patient-report.entity';
import { Users } from 'src/model/user.entity';
import { AuthMiddleware } from 'src/middleware/auth.middleware';
import { OnboardingMiddleware } from 'src/middleware/onboarding.middleware';
import { HfModule } from 'src/hf/hf.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Patients,
      AIPatientGeneratedReport,
      Users,
      Doctors,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
    HfModule,
    CloudinaryModule,
  ],
  controllers: [PatientController],
  providers: [PatientService],
})
export class PatientModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(PatientController);
    consumer
      .apply(OnboardingMiddleware)
      .exclude(
        { path: 'patient/onboard', method: RequestMethod.POST },
        { path: 'patient/onboard-report', method: RequestMethod.POST },
      )
      .forRoutes(PatientController);
  }
}
