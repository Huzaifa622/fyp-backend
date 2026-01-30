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
    const { doctorId, date } = dto;
    const appointmentDate = new Date(date);

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

    // 3. check availability
    // This part assumes we have exact time slot matching or we just check if doctor has a slot.
    // However, the prompt implies "look for available time appointment".
    // For simplicity, we'll check if there is an overlapping appointment or if it matches a valid slot.
    // Assuming the DTO date matches a slot exactly or we just check availability.

    // Check if slot exists in doctor's definition
    // AND check if it's already booked.

    // Simple check: Is this time already booked for this doctor?
    // Check for existing appointment
    const existingAppointment = await this.appointmentRepo.findOne({
      where: {
        doctor: { id: doctorId },
        appointmentDate: appointmentDate,
        status: AppointmentStatus.CONFIRMED,
      },
    });

    if (existingAppointment) {
      throw new BadRequestException('This time slot is already booked');
    }

    // Mark the TimeSlot as booked
    // Assuming appointmentDate matches key properties of TimeSlot (e.g. startTime)
    // Note: exact match required.
    const timeSlot = await this.timeSlotRepo.findOne({
      where: {
        doctor: { id: doctorId },
        startTime: appointmentDate, // Assuming DTO date is the full start timestamp
      },
    });

    if (timeSlot) {
      if (timeSlot.isBooked) {
        throw new BadRequestException('Time slot is already booked');
      }
      timeSlot.isBooked = true;
      await this.timeSlotRepo.save(timeSlot);
    } else {
      // Optional: Enforce that an appointment MUST correspond to a valid slot?
      // The user prompt implies "available time slots of doctor... while take appointment... booked become true".
      // So likely we should enforce it.
      // throw new BadRequestException('Invalid time slot');
      // For now, I'll just warn or proceed if logic allows ad-hoc (but typically slots are strict).
      // I'll leave it as non-strict or just update if found, to avoiding breaking rigidness if legacy matches didn't strictly align.
      // But actually, for "booked become true", we must find it.
      // I will assume slot MUST exist.
      throw new BadRequestException('Invalid or unavailable time slot');
    }

    // 4. Create Appointment
    const appointment = this.appointmentRepo.create({
      doctor,
      patient,
      appointmentDate,
      status: AppointmentStatus.CONFIRMED, // Auto-confirm for now? Or Pending? Prompt says "email was send... confirm".
    });

    const savedAppointment = await this.appointmentRepo.save(appointment);

    // 5. Send Emails
    // To Patient
    await this.mailService.sendAppointmentConfirmation(
      patient.user.email,
      patient.user.firstName + ' ' + patient.user.lastName || 'Patient', // Assuming name exists
      doctor.user.firstName + ' ' + doctor.user.lastName || 'Doctor',
      appointmentDate,
    );

    // To Doctor
    await this.mailService.sendDoctorNotification(
      doctor.user.email,
      doctor.user.firstName + ' ' + doctor.user.lastName || 'Doctor',
      patient.user.firstName + ' ' + patient.user.lastName || 'Patient',
      appointmentDate,
    );

    return savedAppointment;
  }

  async cancelAppointment(userId: number, appointmentId: number) {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: ['patient', 'patient.user', 'doctor'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Verify ownership
    if (appointment.patient.user.id != userId) {
      throw new BadRequestException(
        'You are not authorized to cancel this appointment',
      );
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Appointment is already cancelled');
    }

    appointment.status = AppointmentStatus.CANCELLED;
    await this.appointmentRepo.save(appointment);

    // Free up the time slot
    const timeSlot = await this.timeSlotRepo.findOne({
      where: {
        doctor: { id: appointment.doctor.id },
        startTime: appointment.appointmentDate,
      },
    });

    if (timeSlot) {
      timeSlot.isBooked = false;
      await this.timeSlotRepo.save(timeSlot);
    }

    return { message: 'Appointment cancelled successfully' };
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
      relations: ['doctor', 'doctor.user'],
      order: { appointmentDate: 'DESC' },
    });
  }
}
