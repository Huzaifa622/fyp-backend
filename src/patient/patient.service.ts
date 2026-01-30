import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAIReportDto } from './dtos/create-ai-report.dto';
import { Repository } from 'typeorm';
import { Patients } from 'src/model/patient.entity';
import { AIPatientGeneratedReport } from 'src/model/ai-patient-report.entity';
import { HfService } from 'src/hf/hf.service';
import { Users } from 'src/model/user.entity';
import * as fs from 'fs';

import { CreatePatientProfileDto } from './dtos/create-patient-profile.dto';

@Injectable()
export class PatientService {
  private readonly logger = new Logger(PatientService.name);

  constructor(
    @InjectRepository(Patients)
    private readonly patientRepo: Repository<Patients>,
    @InjectRepository(AIPatientGeneratedReport)
    private readonly reportRepo: Repository<AIPatientGeneratedReport>,
    @InjectRepository(Users)
    private readonly userRepo: Repository<Users>,
    private readonly hfService: HfService,
  ) {}

  async createProfile(userId: number, dto: CreatePatientProfileDto) {
    let patient = await this.patientRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!patient) {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      patient = this.patientRepo.create({
        user: user,
        ...dto
      });
    }

    // if (dto.dateOfBirth) patient.dateOfBirth = new Date(dto.dateOfBirth);
    // if (dto.gender) patient.gender = dto.gender;
    // if (dto.bloodGroup) patient.bloodGroup = dto.bloodGroup;
    // if (dto.address) patient.address = dto.address;

    return this.patientRepo.save(patient);
  }

  async generateAIReport(
    userId: number,
    dto: CreateAIReportDto,
    images: Array<Express.Multer.File>,
  ) {
    // 1. Find or create patient profile if not strictly enforced yet.
    // For now, assuming patient profile might already exist linked to user.
    let patient = await this.patientRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!patient) {
      // Create a basic patient profile if it doesn't exist
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      patient = this.patientRepo.create({
        user: user,
      });
      await this.patientRepo.save(patient);
    }

    // 2. Prepare images for HF (read from disk and convert to base64)
    const imagesBase64 = images.map((image) => {
      // images are stored on disk by multer
      const fileBuffer = fs.readFileSync(image.path);
      return fileBuffer.toString('base64');
    });

    // 3. Call Hugging Face Service
    const aiResponse = await this.hfService.generateReport(
      dto.description,
      imagesBase64,
    );

    // 4. Save Report
    const report = this.reportRepo.create({
      aiResponse,
      description: dto.description,
      imagePaths: images.map((img) => img.path), // Multer saves to disk, so path is available
      patient,
    });

    return this.reportRepo.save(report);
  }
}
