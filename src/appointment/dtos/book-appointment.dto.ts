import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber } from 'class-validator';

export class BookAppointmentDto {
  @ApiProperty({ example: 1, description: 'ID of the doctor' })
  @IsNumber()
  @IsNotEmpty()
  doctorId: number;

  @ApiProperty({
    example: 123,
    description: 'ID of the specific time slot',
  })
  @IsNumber()
  @IsNotEmpty()
  slotId: number;
}
