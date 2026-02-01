import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FindDoctorQueryDto {
  @ApiPropertyOptional({
    description: 'Search by name, email, bio, or clinic address',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
