import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { Appointment } from 'src/model/appointment.entity';
import { Doctors } from 'src/model/doctor.entity';
import { Patients } from 'src/model/patient.entity';
import { TimeSlots } from 'src/model/time-slot.entity';
import { CommonModule } from 'src/common/common.module';
import { AuthMiddleware } from 'src/middleware/auth.middleware';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, Doctors, Patients, TimeSlots]),
    CommonModule,
  ],
  controllers: [AppointmentController],
  providers: [AppointmentService],
})
export class AppointmentModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(AppointmentController);
  }
}
