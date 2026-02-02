import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Delete,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { OnBoardingDoctorDto } from './dtos/onboarding-doctor.dto';
import { CreateTimeSlotDto } from './dtos/create-time-slot.dto';
import { DoctorService } from './doctor.service';
import { Doctors } from 'src/model/doctor.entity';
import { GetUser } from 'src/users/decorators/get-user.decorator';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { UpdateDoctorProfileDto } from './dtos/update-doctor-profile.dto';
import { FindDoctorQueryDto } from './dtos/find-doctor.query.dto';
import { UpdateTimeSlotDto } from './dtos/update-time-slot.dto';

@ApiTags('Doctor')
@Controller('doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

 

  @Get('/profile/me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current doctor profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns doctor profile',
    type: Doctors,
  })
  getProfile(@GetUser() user: { userId: number }) {
    return this.doctorService.getProfile(user.userId);
  }

  @Patch('/profile/me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current doctor profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: Doctors,
  })
  updateProfile(
    @GetUser() user: { userId: number },
    @Body() dto: UpdateDoctorProfileDto,
  ) {
    return this.doctorService.updateProfile(user.userId, dto);
  }

  @Get('/pending')
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'List all pending doctors with search filters (Admin only)',
  })
  @ApiResponse({ status: 200, description: 'List of doctors', type: [Doctors] })
  getAllPendingDoctors(@Query() query: FindDoctorQueryDto) {
    return this.doctorService.getAllPendingDoctors(query);
  }

  @Get('/slots')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all time slots for your doctor profile' })
  @ApiResponse({ status: 200, description: 'Return all time slots' })
  @ApiResponse({ status: 400, description: 'Doctor not found' })
  getMySlots(@GetUser() user: { userId: number }) {
    return this.doctorService.getDoctorTimeSlotsByUserId(user.userId);
  }

  @Post('/onboard')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Onboard a new doctor' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'degree', maxCount: 1 },
      { name: 'certificate', maxCount: 1 },
    ]),
  )
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'licenseNumber',
        'experienceYears',
        'consultationFee',
        'timeSlots',
        'degree',
      ],
      properties: {
        licenseNumber: { type: 'string', example: 'DOC-12345' },
        experienceYears: { type: 'number', example: 5 },
        consultationFee: { type: 'number', example: 1500 },
        bio: { type: 'string', example: 'Experienced cardiologist' },
        clinicAddress: { type: 'string', example: '123 Medical Plaza' },
        timeSlots: { type: 'array', items: { type: 'object' } },
        degree: { type: 'string', format: 'binary' },
        certificate: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Doctor successfully onboarded' })
  onboardDoctor(
    @GetUser() user: any,
    @Body() dto: OnBoardingDoctorDto,
    @UploadedFiles() files: any,
  ) {
    if (!files?.degree?.[0]) {
      throw new BadRequestException('Degree image is required');
    }
    return this.doctorService.onboard(user.userId, dto, files);
  }

  @Post('/slots')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add time slots to your doctor profile' })
  @ApiResponse({ status: 201, description: 'Time slot added successfully' })
  createTimeSlot(
    @GetUser() user: { userId: number },
    @Body() dto: CreateTimeSlotDto,
  ) {
    return this.doctorService.addTimeSlots(user.userId, dto);
  }

  // --- Parameterized Routes ---

  @Get('/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a doctor by ID' })
  @ApiResponse({ status: 200, description: 'Doctor found' })
  getDoctorById(@Param('id', ParseIntPipe) id: number) {
    return this.doctorService.getDoctorById(id);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all doctors with search filters' })
  @ApiResponse({ status: 200, description: 'List of doctors', type: [Doctors] })
  getAllDoctors(@Query() query: FindDoctorQueryDto) {
    return this.doctorService.getAllDoctors(query);
  }

  @Post('/:id/verify')
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Verify a doctor (Admin only)' })
  @ApiResponse({ status: 200, description: 'Doctor verified' })
  verifyDoctor(@Param('id', ParseIntPipe) id: number) {
    return this.doctorService.verifyDoctor(id);
  }

  @Get('/:id/slots')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all time slots for a specific doctor profile' })
  @ApiResponse({ status: 200, description: 'Return all time slots' })
  getDoctorTimeSlots(@Param('id', ParseIntPipe) id: number) {
    return this.doctorService.getDoctorTimeSlots(id);
  }

  @Delete('/slots/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a specific time slot' })
  @ApiResponse({ status: 200, description: 'Time slot deleted' })
  deleteTimeSlot(
    @GetUser() user: { userId: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.doctorService.deleteTimeSlot(user.userId, id);
  }

  @Patch('/slots/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a specific time slot' })
  @ApiResponse({ status: 200, description: 'Time slot updated' })
  updateTimeSlot(
    @GetUser() user: { userId: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTimeSlotDto,
  ) {
    return this.doctorService.updateTimeSlot(user.userId, id, dto);
  }
}
