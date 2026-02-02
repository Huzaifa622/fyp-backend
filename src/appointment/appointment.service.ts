import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment, AppointmentStatus } from 'src/model/appointment.entity';
import { Doctors } from 'src/model/doctor.entity';
import { Patients } from 'src/model/patient.entity';
import { TimeSlots } from 'src/model/time-slot.entity';
import { MailService } from 'src/common/mail.service';
import { Repository } from 'typeorm';
import { BookAppointmentDto } from './dtos/book-appointment.dto';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(Doctors)
    private readonly doctorRepo: Repository<Doctors>,
    @InjectRepository(Patients)
    private readonly patientRepo: Repository<Patients>,
    @InjectRepository(TimeSlots)
    private readonly timeSlotRepo: Repository<TimeSlots>,
    private readonly mailService: MailService,
  ) {}

  async bookAppointment(userId: number, dto: BookAppointmentDto) {
    const { doctorId, slotId } = dto;

    // 1. Validate Patient
    const patient = await this.patientRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!patient) {
      throw new NotFoundException('Patient profile not found for this user');
    }

    // 2. Validate Doctor
    const doctor = await this.doctorRepo.findOne({
      where: { id: doctorId, isVerified: true },
      relations: ['user'],
    });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // 3. Validate Time Slot
    const timeSlot = await this.timeSlotRepo.findOne({
      where: {
        id: slotId,
        doctor: { id: doctorId },
      },
    });

    if (!timeSlot) {
      throw new NotFoundException('Time slot not found for this doctor');
    }

    if (timeSlot.isBooked) {
      throw new BadRequestException('This time slot is already booked');
    }

    // Check for existing appointment for this slot (backup check)
    const existingAppointment = await this.appointmentRepo.findOne({
      where: {
        slot: { id: slotId },
        status: AppointmentStatus.CONFIRMED,
      },
    });

    if (existingAppointment) {
      throw new BadRequestException(
        'An appointment already exists for this slot',
      );
    }

    // New: Check for patient overlap (don't let patient double book themselves)
    const patientOverlap = await this.appointmentRepo.findOne({
      where: {
        patient: { id: patient.id },
        appointmentDate: timeSlot.date,
        status: AppointmentStatus.CONFIRMED,
      },
      relations: ['slot'],
    });

    if (patientOverlap) {
      const s1 = new Date(timeSlot.startTime);
      const e1 = new Date(timeSlot.endTime);
      const s2 = new Date(patientOverlap.slot.startTime);
      const e2 = new Date(patientOverlap.slot.endTime);

      if (s1 < e2 && s2 < e1) {
        throw new BadRequestException(
          `You already have a confirmed appointment at this time (${this.formatTime(s2)} - ${this.formatTime(e2)})`,
        );
      }
    }

    // 4. Create Appointment
    const appointment = this.appointmentRepo.create({
      doctor,
      patient,
      slot: timeSlot,
      appointmentDate: timeSlot.date,
      status: AppointmentStatus.CONFIRMED,
    });

    // Mark slot as booked
    timeSlot.isBooked = true;
    await this.timeSlotRepo.save(timeSlot);

    const savedAppointment = await this.appointmentRepo.save(appointment);

    // 5. Send Emails
    await this.mailService.sendAppointmentConfirmation(
      patient.user.email,
      `${patient.user.firstName} ${patient.user.lastName}`,
      `${doctor.user.firstName} ${doctor.user.lastName}`,
      timeSlot.startTime,
    );

    await this.mailService.sendDoctorNotification(
      doctor.user.email,
      `${doctor.user.firstName} ${doctor.user.lastName}`,
      `${patient.user.firstName} ${patient.user.lastName}`,
      timeSlot.startTime,
    );

    return savedAppointment;
  }

  async cancelAppointment(userId: number, appointmentId: number) {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: ['patient', 'patient.user', 'doctor', 'slot'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const isPatient = appointment.patient.user.id === userId;
    const isDoctor = appointment.doctor.user.id === userId;

    if (!isPatient && !isDoctor) {
      throw new BadRequestException(
        'You are not authorized to cancel this appointment',
      );
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Appointment is already cancelled');
    }

    if (appointment.slot && appointment.slot.startTime) {
      const now = new Date();
      const slotStart = new Date(appointment.slot.startTime);
      const oneHourBefore = new Date(slotStart.getTime() - 60 * 60 * 1000);
      if (now > oneHourBefore) {
        throw new BadRequestException(
          'Cannot cancel appointment less than 1 hour before start time',
        );
      }
    }

    appointment.status = AppointmentStatus.CANCELLED;
    await this.appointmentRepo.save(appointment);

    // Free up the time slot
    if (appointment.slot) {
      const timeSlot = await this.timeSlotRepo.findOne({
        where: { id: appointment.slot.id },
      });
      if (timeSlot) {
        timeSlot.isBooked = false;
        await this.timeSlotRepo.save(timeSlot);
      }
    }

    return { message: 'Appointment cancelled successfully' };
  }

  async completeAppointment(userId: number, appointmentId: number) {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: ['doctor', 'doctor.user', 'slot'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Verify it's the doctor completing it
    if (appointment.doctor.user.id !== userId) {
      throw new BadRequestException(
        'You are not authorized to complete this appointment',
      );
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Cannot complete a cancelled appointment');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Appointment is already completed');
    }

    // Allow marking completed only after the appointment slot end time
    if (appointment.slot && appointment.slot.endTime) {
      const now = new Date();
      const slotEnd = new Date(appointment.slot.endTime);
      if (now < slotEnd) {
        throw new BadRequestException(
          'Cannot mark appointment as completed before it has finished',
        );
      }
    }

    appointment.status = AppointmentStatus.COMPLETED;
    return this.appointmentRepo.save(appointment);
  }

  async getMyAppointments(userId: number) {
    // Find patient profile first
    const patient = await this.patientRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!patient) {
      // If patient profile doesn't exist, they have no appointments
      return [];
    }

    return this.appointmentRepo.find({
      where: { patient: { id: patient.id } },
      relations: ['doctor', 'doctor.user', 'slot'],
      order: { appointmentDate: 'DESC' },
    });
  }

  async getDoctorAppointments(userId: number) {
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!doctor) {
      return [];
    }

    return this.appointmentRepo.find({
      where: { doctor: { id: doctor.id } },
      relations: ['patient', 'patient.user', 'slot'],
      order: { appointmentDate: 'DESC' },
    });
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }
}
