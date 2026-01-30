import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Doctors } from 'src/model/doctor.entity';
import { TimeSlots } from 'src/model/time-slot.entity';
import { Repository } from 'typeorm';
import { CreateTimeSlotDto } from './dtos/create-time-slot.dto';
import { OnBoardingDoctorDto } from './dtos/onboarding-doctor.dto';

import { Users } from 'src/model/user.entity';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctors) private readonly doctorRepo: Repository<Doctors>,
    @InjectRepository(TimeSlots)
    private readonly timeSlotRepo: Repository<TimeSlots>,
    @InjectRepository(Users)
    private readonly userRepo: Repository<Users>,
    private configService: ConfigService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async onboard(
    userId: number,
    dto: OnBoardingDoctorDto,
    files: {
      degree?: Express.Multer.File[];
      certificate?: Express.Multer.File[];
    },
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const existingDoctor = await this.doctorRepo.findOne({
      where: { user: { id: userId } },
    });

    if (existingDoctor) {
      throw new BadRequestException('Doctor already onboarded');
    }

    // Update user details (name) - REMOVED as per user request (handled in registration)
    // user.firstName = dto.firstName;
    // user.lastName = dto.lastName;
    // await this.userRepo.save(user);

    const degreeUpload = await this.cloudinaryService.uploadFile(
      files.degree?.[0]!,
    );

    let certificateUpload: any;
    if (files.certificate?.[0]) {
      certificateUpload = await this.cloudinaryService.uploadFile(
        files.certificate?.[0]!,
      );
    }

    // Parse timeSlots if it comes as a JSON string from multipart/form-data
    let timeSlots = dto.timeSlots;
    if (typeof timeSlots === 'string') {
      try {
        timeSlots = JSON.parse(timeSlots);
      } catch (error) {
        throw new BadRequestException('Invalid timeSlots format');
      }
    }

    if (!Array.isArray(timeSlots)) {
      throw new BadRequestException('timeSlots must be an array');
    }

    const doctor = this.doctorRepo.create({
      licenseNumber: dto.licenseNumber,
      experienceYears: dto.experienceYears,
      consultationFee: dto.consultationFee,
      bio: dto.bio,
      clinicAddress: dto.clinicAddress,
      user: user,
      isVerified: false,
      degreePath: (degreeUpload as any).secure_url,
      certificatePath: certificateUpload
        ? (certificateUpload as any).secure_url
        : null,

      timeSlots: timeSlots.map((slot) => ({
        date: new Date(slot.date),
        startTime: new Date(slot.startTime),
        endTime: new Date(slot.endTime),
      })),
    });

    return this.doctorRepo.save(doctor);
  }

  async getDoctorById(id: number) {
    const doctor = await this.doctorRepo.findOne({
      where: { id },
      relations: ['user', 'timeSlots'],
    });

    if (!doctor || !doctor.isVerified) {
      throw new BadRequestException('Doctor not found or not verified');
    }

    return doctor;
  }

  async verifyDoctor(id: number) {
    const doctor = await this.doctorRepo.findOne({ where: { id } });
    if (!doctor) throw new BadRequestException('Doctor not found');

    doctor.isVerified = true;
    return this.doctorRepo.save(doctor);
  }

  private async ensureDoctorOnboarded(userId: number) {
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!doctor) {
      throw new BadRequestException(
        'You must complete doctor onboarding before accessing this feature',
      );
    }

    return doctor;
  }

  async getDoctorTimeSlots(userId: number) {
    // Ensure doctor is onboarded before getting time slots
    const doctor = await this.ensureDoctorOnboarded(userId);

    return this.timeSlotRepo.find({
      where: { doctor: { id: doctor.id } },
      order: { startTime: 'ASC' },
    });
  }

  async addTimeSlots(userId: number, dto: CreateTimeSlotDto) {
    // Ensure doctor is onboarded before adding time slots
    const doctor = await this.ensureDoctorOnboarded(userId);

    const timeSlot = this.timeSlotRepo.create({
      doctor: { id: doctor.id },
      date: new Date(dto.date),
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      isBooked: false,
    });

    return this.timeSlotRepo.save(timeSlot);
  }

  async getAllDoctors() {
    return this.doctorRepo.find({
      where: { isVerified: true },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAllPendingDoctors() {
    return this.doctorRepo.find({
      where: { isVerified: false },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }
}
