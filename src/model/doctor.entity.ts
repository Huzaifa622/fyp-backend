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
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'id',
  })
  id: number;

  @OneToOne(() => Users, {
    eager: true,
  })
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @Column({
    name: 'license_number',
    nullable: false,
    unique: true,
  })
  licenseNumber: string;

  @Column({
    name: 'experience_years',
    type: 'int',
    default: 0,
  })
  experienceYears: number;

  @Column({
    name: 'consultation_fee',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  consultationFee: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  bio: string;

  @Column({
    name: 'clinic_address',
    type: 'text',
    nullable: true,
  })
  clinicAddress: string | null;

  @Column({
    type: 'float',
    default: 0,
  })
  rating: number;

  @Column({
    name: 'is_available',
    type: 'boolean',
    default: true,
  })
  isAvailable: boolean;

  @Column({
    name: 'is_verified',
    type: 'boolean',
    default: false,
  })
  isVerified: boolean;

  @Column({ name: 'degree_path', type: 'text', nullable: true })
  degreePath: string | null;

  @Column({ name: 'certificate_path', type: 'text', nullable: true })
  certificatePath: string | null;

  @OneToMany(() => TimeSlots, (slot) => slot.doctor, {
    cascade: true,
  })
  timeSlots: TimeSlots[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
