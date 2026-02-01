import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Users } from './user.entity';
import { TimeSlots } from './time-slot.entity';

@Entity({ name: 'doctors' })
export class Doctors {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'id',
  })
  id: number;

  @ApiProperty({ type: () => Users })
  @OneToOne(() => Users, {
    eager: true,
  })
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @ApiProperty({ example: 'DOC-12345' })
  @Column({
    name: 'license_number',
    nullable: false,
    unique: true,
  })
  licenseNumber: string;

  @ApiProperty({ example: 5 })
  @Column({
    name: 'experience_years',
    type: 'int',
    default: 0,
  })
  experienceYears: number;

  @ApiProperty({ example: 1500 })
  @Column({
    name: 'consultation_fee',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  consultationFee: number;

  @ApiProperty({ example: 'Experienced cardiologist' })
  @Column({
    type: 'text',
    nullable: true,
  })
  bio: string;

  @ApiProperty({ example: '123 Medical Plaza, Karachi' })
  @Column({
    name: 'clinic_address',
    type: 'text',
    nullable: true,
  })
  clinicAddress: string | null;

  @ApiProperty({ example: 4.5 })
  @Column({
    type: 'float',
    default: 0,
  })
  rating: number;

  @ApiProperty({ example: true })
  @Column({
    name: 'is_available',
    type: 'boolean',
    default: true,
  })
  isAvailable: boolean;

  @ApiProperty({ example: false })
  @Column({
    name: 'is_verified',
    type: 'boolean',
    default: false,
  })
  isVerified: boolean;

  @ApiProperty({ example: 'path/to/degree.jpg' })
  @Column({ name: 'degree_path', type: 'text', nullable: true })
  degreePath: string | null;

  @ApiProperty({ example: 'path/to/certificate.jpg' })
  @Column({ name: 'certificate_path', type: 'text', nullable: true })
  certificatePath: string | null;

  @ApiProperty({ type: () => [TimeSlots] })
  @OneToMany(() => TimeSlots, (slot) => slot.doctor, {
    cascade: true,
  })
  timeSlots: TimeSlots[];

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
