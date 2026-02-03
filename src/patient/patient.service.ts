import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAIReportDto } from './dtos/create-ai-report.dto';
import { Repository } from 'typeorm';
import { Patients } from 'src/model/patient.entity';
import { AIPatientGeneratedReport } from 'src/model/ai-patient-report.entity';
import { HfService } from 'src/hf/hf.service';
import { Users } from 'src/model/user.entity';
import { CreatePatientProfileDto } from './dtos/create-patient-profile.dto';

import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

import { UpdatePatientProfileDto } from './dtos/update-patient-profile.dto';

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

  async generateAIReport(
    userId: number,
    dto: CreateAIReportDto,
    images: Array<Express.Multer.File>,
  ) {
    const patient = await this.patientRepo.findOne({
      where: { user: { id: userId } },
    });

    const uploadPromises = images.map((img) =>
      this.cloudinaryService.uploadFile(img),
    );
    const uploadResults = await Promise.all(uploadPromises);
    const imageUrls = uploadResults.map((res) => (res as any).secure_url);

    // 3. Call Hugging Face Service
    const { content, diseaseName, confidenceScore } =
      await this.hfService.generateReport(
        dto.description,
        imageUrls, // Pass URLs, not Base64 (HfService was updated to accept URLs in previous steps)
      );

    // 4. Save Report
    const report = this.reportRepo.create({
      aiResponse: content,
      diseaseName,
      confidenceScore,
      description: dto.description,
      imagePaths: imageUrls,
      patient: patient!, // Middleware ensures this exists
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

  async getProfile(userId: number) {
    const patient = await this.patientRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!patient) {
      throw new NotFoundException('Patient profile not found');
    }

    return patient;
  }

  async updateProfile(userId: number, dto: UpdatePatientProfileDto, avatar?: Express.Multer.File) {
    const patient = await this.patientRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!patient) {
      throw new NotFoundException('Patient profile not found');
    }

    // Update user fields
    if (avatar) {
      const uploadResult = await this.cloudinaryService.uploadFile(avatar);
      patient.user.avatar = (uploadResult as any).secure_url;
    }
    if (dto.firstName) patient.user.firstName = dto.firstName;
    if (dto.lastName) patient.user.lastName = dto.lastName;
    await this.userRepo.save(patient.user);

    // Update patient fields
    if (dto.dateOfBirth) patient.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.gender) patient.gender = dto.gender;
    if (dto.bloodGroup) patient.bloodGroup = dto.bloodGroup;
    if (dto.address) patient.address = dto.address;

    return this.patientRepo.save(patient);
  }

  async getMyReports(userId: number) {
    const patient = await this.patientRepo.findOne({
      where: { user: { id: userId } },
    });
    return this.reportRepo.find({
      where: { patient: { id: patient!.id } },
      order: { createdAt: 'DESC' },
    });
  }
}
