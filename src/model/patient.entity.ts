import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Users } from './user.entity';

@Entity()
export class Patients {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'id',
  })
  id: number;

  @ApiProperty({ type: () => Users })
  @OneToOne(() => Users)
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @ApiProperty({ example: '1990-01-01' })
  @Column({
    type: 'date',
    name: 'date_of_birth',
    nullable: true,
  })
  dateOfBirth: Date;

  @ApiProperty({ example: 'Male' })
  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  gender: string;

  @ApiProperty({ example: 'O+' })
  @Column({
    name: 'blood_group',
    type: 'varchar',
    length: 5,
    nullable: true,
  })
  bloodGroup: string;

  @ApiProperty({ example: '456 Garden Road, Lahore' })
  @Column({
    type: 'text',
    nullable: true,
  })
  address: string;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
