import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { OnBoardingDoctorDto } from './dtos/onboarding-doctor.dto';
import { DoctorService } from './doctor.service';
import { GetUser } from 'src/users/decorators/get-user.decorator';

@Controller('doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Post('doctor/onboard')
  @ApiBearerAuth()
  onboardDoctor(
    @GetUser()
    user: {
      email: string;
      userId: number;
      firstName: string;
      lastName: string;
    },
    @Body() dto: OnBoardingDoctorDto,
  ) {
    return this.doctorService.onboard(user.userId, dto);
  }
}
