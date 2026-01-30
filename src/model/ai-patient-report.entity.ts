import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Patients } from './patient.entity';

@Entity()
export class AIPatientGeneratedReport {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'id',
  })
  id: number;

  @Column({ type: 'text', name: 'ai_response' })
  aiResponse: string;

  @Column({ type: 'text', array: true, default: [] })
  imagePaths: string[];

  @Column({ type: 'text', name: 'description', nullable: true })
  description: string;

  @ManyToOne(() => Patients)
  @JoinColumn({ name: 'patient_id' })
  patient: Patients;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
