import {
  IsDateString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TimeRangeDto {
  @IsNotEmpty()
  @IsDateString()
  startTime: string; // ISO timestamp

  @IsNotEmpty()
  @IsDateString()
  endTime: string; // ISO timestamp
}

export class DoctorTimeSlotDto {
  @IsNotEmpty()
  @IsDateString()
  date: string; // YYYY-MM-DD

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeRangeDto)
  timeRanges: TimeRangeDto[];
}
