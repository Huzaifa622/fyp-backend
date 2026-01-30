import {
  Body,
  Controller,
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
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateAIReportDto } from './dtos/create-ai-report.dto';
import { PatientService } from './patient.service';
// Helper for file naming (optional, but good for avoiding collisions/overwrites if default behavior isn't enough)
// Removed diskStorage to use MemoryStorage for Cloudinary

import { CreatePatientProfileDto } from './dtos/create-patient-profile.dto';

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
  @UseInterceptors(FilesInterceptor('images', 5))
  async generateReport(
    @Req() req: any,
    @Body() dto: CreateAIReportDto,
    @UploadedFiles() images: Array<Express.Multer.File>,
  ) {
    const userId = req['user']?.userId || req['user']?.id;
    return this.patientService.generateAIReport(userId, dto, images);
  }
}
