import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientController } from './patient.controller';
import { PatientService } from './patient.service';
import { Patients } from 'src/model/patient.entity';
import { AIPatientGeneratedReport } from 'src/model/ai-patient-report.entity';
import { Users } from 'src/model/user.entity';
import { AuthMiddleware } from 'src/middleware/auth.middleware';
import { HfModule } from 'src/hf/hf.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Patients, AIPatientGeneratedReport, Users]),
    HfModule,
  ],
  controllers: [PatientController],
  providers: [PatientService],
})
export class PatientModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(PatientController);
  }
}
