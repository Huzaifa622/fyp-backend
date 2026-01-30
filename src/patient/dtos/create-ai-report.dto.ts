import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumberString,
  IsOptional,
} from 'class-validator';

export class CreateAIReportDto {
  @ApiProperty({
    description: 'Questions and details about the skin condition',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  // patientId will be extracted from JWT/User context usually, but finding it explicitly if needed
  // For now, assuming we might pass it or infer it.
  // If the user context is available, we don't strictly need it in DTO, but the prompt implies "patient onboarding" which might be before full login?
  // Actually, usually onboarding happens after signup.
}
