import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class CreatePatientProfileDto {
  @ApiProperty({ description: 'Date of Birth (YYYY-MM-DD)', required: false })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({
    description: 'Gender',
    required: true,
    enum: ['Male', 'Female', 'Other'],
  })
  @IsString()
  gender: string;

  @ApiProperty({ description: 'Blood Group', required: true })
  @IsString()
  bloodGroup: string;

  @ApiProperty({ description: 'Address', required: false })
  @IsOptional()
  @IsString()
  address?: string;
}
