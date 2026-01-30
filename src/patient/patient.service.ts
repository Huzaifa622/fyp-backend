import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAIReportDto } from './dtos/create-ai-report.dto';
import { Repository } from 'typeorm';
import { Patients } from 'src/model/patient.entity';
import { AIPatientGeneratedReport } from 'src/model/ai-patient-report.entity';
import { HfService } from 'src/hf/hf.service';
import { Users } from 'src/model/user.entity';
import { CreatePatientProfileDto } from './dtos/create-patient-profile.dto';

import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

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
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ... (createProfile remains same)

  async generateAIReport(
    userId: number,
    dto: CreateAIReportDto,
    images: Array<Express.Multer.File>,
  ) {
    // 1. Find or create patient profile
    let patient = await this.patientRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!patient) {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      patient = this.patientRepo.create({
        user: user,
      });
      await this.patientRepo.save(patient);
    }

    const uploadPromises = images.map((img) =>
      this.cloudinaryService.uploadFile(img),
    );
    const uploadResults = await Promise.all(uploadPromises);
    const imageUrls = uploadResults.map((res) => (res as any).secure_url);

    // const imagesBase64 = images.map((image) => image.buffer.toString('base64'));

    const aiResponse = await this.hfService.generateReport(
      dto.description,
      imageUrls,
    );

    // 4. Save Report
    const report = this.reportRepo.create({
      aiResponse,
      description: dto.description,
      imagePaths: imageUrls,
      patient,
    });

    await this.reportRepo.save(report);

    return report;
  }

  async createProfile(userId: number, dto: CreatePatientProfileDto) {
    let patient = await this.patientRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!patient) {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      patient = this.patientRepo.create({
        user: user,
        ...dto,
      });
    }

    // if (dto.dateOfBirth) patient.dateOfBirth = new Date(dto.dateOfBirth);
    // if (dto.gender) patient.gender = dto.gender;
    // if (dto.bloodGroup) patient.bloodGroup = dto.bloodGroup;
    // if (dto.address) patient.address = dto.address;

    return this.patientRepo.save(patient);
  }
}
