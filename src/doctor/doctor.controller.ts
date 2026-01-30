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
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import {
  BadRequestException,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { OnBoardingDoctorDto } from './dtos/onboarding-doctor.dto';
import { CreateTimeSlotDto } from './dtos/create-time-slot.dto';
import { DoctorService } from './doctor.service';
import { GetUser } from 'src/users/decorators/get-user.decorator';
import { AdminGuard } from 'src/common/guards/admin.guard';

@ApiTags('Doctor')
@Controller('doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get('/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a doctor by ID' })
  @ApiResponse({ status: 200, description: 'Doctor found' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  getDoctorById(@Param('id', ParseIntPipe) id: number) {
    return this.doctorService.getDoctorById(id);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all doctors' })
  @ApiResponse({ status: 200, description: 'List of doctors' })
  getAllDoctors() {
    return this.doctorService.getAllDoctors();
  }

  @Get('/pending')
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'List all pending doctors (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of doctors' })
  getAllPendingDoctors() {
    return this.doctorService.getAllPendingDoctors();
  }

  @Post('/:id/verify')
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Verify a doctor (Admin only)' })
  @ApiResponse({ status: 200, description: 'Doctor verified' })
  verifyDoctor(@Param('id', ParseIntPipe) id: number) {
    return this.doctorService.verifyDoctor(id);
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
        licenseNumber: {
          type: 'string',
          description: 'Doctor license number (must be unique)',
          example: 'DOC-12345',
        },
        experienceYears: {
          type: 'number',
          description: 'Years of medical experience',
          example: 5,
        },
        consultationFee: {
          type: 'number',
          description: 'Consultation fee in currency units',
          example: 1500,
        },
        bio: {
          type: 'string',
          description: 'Doctor biography (optional)',
          example: 'Experienced cardiologist specializing in heart diseases',
        },
        clinicAddress: {
          type: 'string',
          description: 'Clinic address (optional)',
          example: '123 Medical Plaza, Karachi',
        },
        timeSlots: {
          type: 'array',
          description: 'Array of available time slots',
          items: {
            type: 'object',
            properties: {
              date: {
                type: 'string',
                format: 'date',
                description: 'Date in YYYY-MM-DD format',
                example: '2026-02-01',
              },
              startTime: {
                type: 'string',
                format: 'date-time',
                description: 'Start time as ISO timestamp',
                example: '2026-02-01T09:00:00.000Z',
              },
              endTime: {
                type: 'string',
                format: 'date-time',
                description: 'End time as ISO timestamp',
                example: '2026-02-01T17:00:00.000Z',
              },
            },
          },
        },
        degree: {
          type: 'string',
          format: 'binary',
          description: 'Degree certificate image file (required)',
        },
        certificate: {
          type: 'string',
          format: 'binary',
          description: 'Medical certificate image file (optional)',
        },
      },
    },
  })
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
    @UploadedFiles()
    files: {
      degree?: Express.Multer.File[];
      certificate?: Express.Multer.File[];
    },
  ) {
    if (!files?.degree?.[0]) {
      throw new BadRequestException('Degree image is required');
    }

    return this.doctorService.onboard(user.userId, dto, files);
  }

  @Post('/slots')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add time slots to your doctor profile' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['date', 'startTime', 'endTime'],
      properties: {
        date: {
          type: 'string',
          format: 'date',
          description: 'Date in YYYY-MM-DD format',
          example: '2026-02-01',
        },
        startTime: {
          type: 'string',
          format: 'date-time',
          description: 'Start time as ISO timestamp',
          example: '2026-02-01T09:00:00.000Z',
        },
        endTime: {
          type: 'string',
          format: 'date-time',
          description: 'End time as ISO timestamp',
          example: '2026-02-01T17:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Time slot added successfully' })
  @ApiResponse({
    status: 400,
    description: 'Doctor not onboarded or invalid data',
  })
  createTimeSlot(
    @GetUser() user: { userId: number },
    @Body() dto: CreateTimeSlotDto,
  ) {
    return this.doctorService.addTimeSlots(user.userId, dto);
  }

  @Get('/:id/slots')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all time slots for your doctor profile' })
  @ApiResponse({ status: 200, description: 'Return all time slots' })
  @ApiResponse({ status: 400, description: 'Doctor not onboarded' })
  getDoctorTimeSlots(@GetUser() user: { userId: number }) {
    return this.doctorService.getDoctorTimeSlots(user.userId);
  }
}
