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
import { diskStorage } from 'multer';
import { extname } from 'path';

// Helper for file naming (optional, but good for avoiding collisions/overwrites if default behavior isn't enough)
const storage = diskStorage({
  destination: './upload',
  filename: (req, file, cb) => {
    const randomName = Array(32)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');
    cb(null, `${randomName}${extname(file.originalname)}`);
  },
});

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
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      storage,
      // If not using storage, it uses default dest from module,
      // but explicit storage is often safer for renaming.
    }),
  )
  async generateReport(
    @Req() req: any,
    @Body() dto: CreateAIReportDto,
    @UploadedFiles() images: Array<Express.Multer.File>,
  ) {
    // Assuming AuthMiddleware attaches user to req['user'] with an id
    const userId = req['user']?.userId || req['user']?.id;
    return this.patientService.generateAIReport(userId, dto, images);
  }
}
