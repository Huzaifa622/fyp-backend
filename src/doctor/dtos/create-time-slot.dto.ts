import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class CreateTimeSlotDto {
  @ApiProperty({
    example: '2024-03-20T09:00:00Z',
    description: 'Start time of the slot',
  })
  @IsNotEmpty()
  @IsDateString()
  startTime: Date;

  @ApiProperty({
    example: '2024-03-20T09:30:00Z',
    description: 'End time of the slot',
  })
  @IsNotEmpty()
  @IsDateString()
  endTime: Date;

  @ApiProperty({ example: '2024-03-20', description: 'Date of the slot' })
  @IsNotEmpty()
  @IsDateString()
  date: Date;
}
