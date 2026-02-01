import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateAIReportDto } from './dtos/create-ai-report.dto';
import { PatientService } from './patient.service';
import { CreatePatientProfileDto } from './dtos/create-patient-profile.dto';
import { UpdatePatientProfileDto } from './dtos/update-patient-profile.dto';
import { Patients } from 'src/model/patient.entity';
import { GetUser } from 'src/users/decorators/get-user.decorator';

@ApiTags('Patient')
@ApiBearerAuth()
@Controller('patient')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post('onboard')
  @ApiOperation({ summary: 'Submit patient profile details' })
  async createProfile(@Req() req: any, @Body() dto: CreatePatientProfileDto) {
    const userId = req['user']?.userId || req['user']?.id;
    return this.patientService.createProfile(userId, dto);
  }

  @Post('onboard-report')
  @ApiOperation({
    summary: 'Submit skin images and questions to generate AI report',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        description: { type: 'string' },
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Report generated successfully' })
  @ApiResponse({ status: 404, description: 'Patient not onboarded' })
  @UseInterceptors(FilesInterceptor('images', 5))
  async generateReport(
    @GetUser() user: { userId: number },
    @Body() dto: CreateAIReportDto,
    @UploadedFiles() images: Array<Express.Multer.File>,
  ) {
    return this.patientService.generateAIReport(user.userId, dto, images);
  }

  @Get('/reports')
  @ApiOperation({ summary: 'Get all AI generated reports for the patient' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of AI generated reports',
  })
  @ApiResponse({ status: 404, description: 'Patient not onboarded' })
  async getMyReports(@GetUser() user: { userId: number }) {
    return this.patientService.getMyReports(user.userId);
  }

  @Get('profile/me')
  @ApiOperation({ summary: 'Get current patient profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns patient profile',
    type: Patients,
  })
  async getProfile(@GetUser() user: { userId: number }) {
    return this.patientService.getProfile(user.userId);
  }

  @Patch('profile/me')
  @ApiOperation({ summary: 'Update current patient profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: Patients,
  })
  async updateProfile(
    @GetUser() user: { userId: number },
    @Body() dto: UpdatePatientProfileDto,
  ) {
    return this.patientService.updateProfile(user.userId, dto);
  }
}
