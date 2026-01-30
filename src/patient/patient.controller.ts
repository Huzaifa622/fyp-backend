import {
  Body,
  Controller,
  Get,
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
// Helper for file naming (optional, but good for avoiding collisions/overwrites if default behavior isn't enough)
// Removed diskStorage to use MemoryStorage for Cloudinary

import { CreatePatientProfileDto } from './dtos/create-patient-profile.dto';
import { GetUser } from 'src/users/decorators/get-user.decorator';

@ApiTags('Patient')
@ApiBearerAuth() // Assuming global auth or applied via middleware
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
}
