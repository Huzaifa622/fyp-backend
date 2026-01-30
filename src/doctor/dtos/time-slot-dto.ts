import { IsDateString, IsNotEmpty } from 'class-validator';

export class DoctorTimeSlotDto {
  @IsNotEmpty()
  @IsDateString()
  date: string; // YYYY-MM-DD

  @IsNotEmpty()
  @IsDateString()
  startTime: string; // ISO timestamp

  @IsNotEmpty()
  @IsDateString()
  endTime: string; // ISO timestamp
}
