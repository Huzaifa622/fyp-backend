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

@Entity()
export class TimeSlots {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'id',
  })
  id: number;

  @ApiProperty({ type: () => Doctors })
  @ManyToOne(() => Doctors)
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctors;

  @ApiProperty({ example: '2026-02-01' })
  @Column({
    type: 'date',
    nullable: false,
  })
  date: Date;

  @ApiProperty({ example: '2026-02-01T09:00:00.000Z' })
  @Column({
    name: 'start_time',
    type: 'timestamp',
    nullable: false,
  })
  startTime: Date;

  @ApiProperty({ example: '2026-02-01T10:00:00.000Z' })
  @Column({
    name: 'end_time',
    type: 'timestamp',
    nullable: false,
  })
  endTime: Date;

  @ApiProperty({ example: false })
  @Column({
    name: 'is_booked',
    type: 'boolean',
    default: false,
  })
  isBooked: boolean;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
