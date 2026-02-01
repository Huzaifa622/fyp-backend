import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DoctorTimeSlotDto } from './time-slot-dto';

export class CreateTimeSlotDto {
  @ApiProperty({
    type: [DoctorTimeSlotDto],
    description: 'Array of date-based time slots with ranges',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DoctorTimeSlotDto)
  slots: DoctorTimeSlotDto[];
}
