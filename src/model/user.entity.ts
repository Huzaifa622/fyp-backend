import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Users {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'id',
  })
  id: number;

  @ApiProperty({ example: 'user@example.com' })
  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    default: '',
  })
  email: string;

  @Column({
    nullable: false,
    default: '',
  })
  password: string;

  @ApiProperty({ example: 'John' })
  @Column({
    nullable: false,
    default: '',
  })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @Column({
    nullable: false,
    default: '',
  })
  lastName: string;

  @ApiProperty({ example: 'patient' })
  @Column({
    type: 'varchar',
    default: 'patient',
  })
  role: string;

  @ApiProperty({ example: true })
  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({ type: 'varchar', length: 128, nullable: true, default: null })
  verificationTokenHash?: string | null;

  @Column({ type: 'timestamp', nullable: true, default: null })
  verificationTokenExpires?: Date | null;

  @ApiProperty({
    example: 'https://ui-avatars.com/api/?name=User&background=random',
  })
  @Column({
    type: 'text',
    nullable: true,
    default: 'https://ui-avatars.com/api/?name=User&background=random',
  })
  avatar: string;
}
