import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OnBoardingDoctorDto } from './dtos/onboarding-doctor.dto';
import { CreateTimeSlotDto } from './dtos/create-time-slot.dto';
import { DoctorService } from './doctor.service';
import { GetUser } from 'src/users/decorators/get-user.decorator';

@ApiTags('Doctor')
@Controller('doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Post('/onboard')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Onboard a new doctor' })
  @ApiResponse({ status: 201, description: 'Doctor successfully onboarded' })
  @ApiResponse({ status: 400, description: 'Doctor already onboarded' })
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

  @Get('/:id')
  @ApiOperation({ summary: 'Get a doctor by ID' })
  @ApiResponse({ status: 200, description: 'Doctor found' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  getDoctorById(@Param('id', ParseIntPipe) id: number) {
    return this.doctorService.getDoctorById(id);
  }

  @Post('/slots')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a time slot' })
  @ApiResponse({ status: 201, description: 'Time slot created' })
  createTimeSlot(
    @GetUser() user: { userId: number },
    @Body() dto: CreateTimeSlotDto,
  ) {
    return this.doctorService.createTimeSlot(user.userId, dto);
  }

  @Get('/:id/slots')
  @ApiOperation({ summary: 'Get all time slots for a doctor' })
  @ApiResponse({ status: 200, description: 'Return all time slots' })
  getDoctorTimeSlots(@GetUser() user: { userId: number }) {
    return this.doctorService.getDoctorTimeSlots(user.userId);
  }
}
