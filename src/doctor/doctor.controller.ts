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
    FileFieldsInterceptor(
      [
        { name: 'degree', maxCount: 1 },
        { name: 'certificate', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './upload',
          filename: (req, file, cb) => {
            const randomName = Array(32)
              .fill(null)
              .map(() => Math.round(Math.random() * 16).toString(16))
              .join('');
            cb(null, `${randomName}${extname(file.originalname)}`);
          },
        }),
      },
    ),
  )
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

  // @Post('/slots')
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Add a time slot' })
  // @ApiResponse({ status: 201, description: 'Time slot created' })
  // createTimeSlot(
  //   @GetUser() user: { userId: number },
  //   @Body() dto: CreateTimeSlotDto,
  // ) {
  //   return this.doctorService.createTimeSlot(user.userId, dto);
  // }

  @Get('/:id/slots')
  @ApiOperation({ summary: 'Get all time slots for a doctor' })
  @ApiResponse({ status: 200, description: 'Return all time slots' })
  getDoctorTimeSlots(@GetUser() user: { userId: number }) {
    return this.doctorService.getDoctorTimeSlots(user.userId);
  }
}
