import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { DoctorTimeSlotDto } from './time-slot-dto';

export class OnBoardingDoctorDto {
  @IsNotEmpty()
  licenseNumber: string;

  @IsNumber()
  experienceYears: number;

  // @IsNotEmpty()
  // specializationId: number;

  @IsNumber()
  consultationFee: number;

  @IsOptional()
  bio?: string;

  @IsOptional()
  clinicAddress?: string;

  // Can be sent as JSON string via form-data or as array
  timeSlots: DoctorTimeSlotDto[] | string;
}
