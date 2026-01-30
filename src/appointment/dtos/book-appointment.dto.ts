import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber } from 'class-validator';

export class BookAppointmentDto {
  @ApiProperty({ example: 1, description: 'ID of the doctor' })
  @IsNumber()
  @IsNotEmpty()
  doctorId: number;

  @ApiProperty({
    example: '2024-01-01T10:00:00Z',
    description: 'Date and time of appointment',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;
}
