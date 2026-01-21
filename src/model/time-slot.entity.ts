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

@Entity()
export class TimeSlots {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'id',
  })
  id: number;

  @ManyToOne(() => Doctors)
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctors;

  @Column({
    type: 'date',
    nullable: false,
  })
  date: Date;

  @Column({
    name: 'start_time',
    type: 'timestamp',
    nullable: false,
  })
  startTime: Date;

  @Column({
    name: 'end_time',
    type: 'timestamp',
    nullable: false,
  })
  endTime: Date;

  @Column({
    name: 'is_booked',
    type: 'boolean',
    default: false,
  })
  isBooked: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
