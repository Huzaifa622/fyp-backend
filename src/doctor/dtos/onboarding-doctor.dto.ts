import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class OnBoardingDoctorDto {
    @IsNotEmpty()
    @IsString()
    firstName: string;

    @IsNotEmpty()
    @IsString()
    lastName: string;

    @IsNotEmpty()
    licenseNumber: string;

    @IsNumber()
    experienceYears: number;

    @IsNotEmpty()
    specializationId: number;

    @IsNumber()
    consultationFee: number;

    @IsOptional()
    bio?: string;

    @IsOptional()
    clinicAddress?: string;
}
