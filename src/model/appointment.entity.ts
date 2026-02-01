import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Doctors } from './doctor.entity';
import { Patients } from './patient.entity';
import { TimeSlots } from './time-slot.entity';

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity()
export class Appointment {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'id',
  })
  id: number;

  @ApiProperty({ example: '2026-02-01T10:00:00.000Z' })
  @Column({
    name: 'appointment_date',
    type: 'timestamp',
  })
  appointmentDate: Date;

  @ApiProperty({ enum: AppointmentStatus, default: AppointmentStatus.PENDING })
  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @ApiProperty({ type: () => Doctors })
  @ManyToOne(() => Doctors)
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctors;

  @ApiProperty({ type: () => Patients })
  @ManyToOne(() => Patients)
  @JoinColumn({ name: 'patient_id' })
  patient: Patients;

  @ApiProperty({ type: () => TimeSlots })
  @ManyToOne(() => TimeSlots)
  @JoinColumn({ name: 'slot_id' })
  slot: TimeSlots;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
