import { IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDoctorProfileDto {
  @ApiPropertyOptional({ example: 'Experienced cardiologist' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: '123 Medical Plaza, Karachi' })
  @IsOptional()
  @IsString()
  clinicAddress?: string;

  @ApiPropertyOptional({ example: 2000 })
  @IsOptional()
  @IsNumber()
  consultationFee?: number;

  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  @IsOptional()
  @IsUrl()
  avatar?: string;
}
