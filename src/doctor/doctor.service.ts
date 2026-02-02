import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Doctors } from 'src/model/doctor.entity';
import { TimeSlots } from 'src/model/time-slot.entity';
import { ILike, Repository } from 'typeorm';
import { CreateTimeSlotDto } from './dtos/create-time-slot.dto';
import { OnBoardingDoctorDto } from './dtos/onboarding-doctor.dto';
import { DoctorTimeSlotDto } from './dtos/time-slot-dto';

import { Users } from 'src/model/user.entity';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

import { UpdateDoctorProfileDto } from './dtos/update-doctor-profile.dto';
import { FindDoctorQueryDto } from './dtos/find-doctor.query.dto';
import { UpdateTimeSlotDto } from './dtos/update-time-slot.dto';

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

    const degreeUpload = await this.cloudinaryService.uploadFile(
      files.degree?.[0]!,
    );

    let certificateUpload: any;
    if (files.certificate?.[0]) {
      certificateUpload = await this.cloudinaryService.uploadFile(
        files.certificate?.[0]!,
      );
    }

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
    });

    const savedDoctor = await this.doctorRepo.save(doctor);

    const slotsToValidate = (timeSlots as DoctorTimeSlotDto[]).map((slot) => ({
      date: slot.date,
      timeRanges: slot.timeRanges,
    }));

    await this.validateTimeSlots(savedDoctor.id, slotsToValidate);

    const timeSlotsToSave = (timeSlots as DoctorTimeSlotDto[]).flatMap((slot) =>
      slot.timeRanges.map((range) =>
        this.timeSlotRepo.create({
          doctor: { id: savedDoctor.id },
          date: new Date(slot.date),
          startTime: new Date(range.startTime),
          endTime: new Date(range.endTime),
          isBooked: false,
        }),
      ),
    );

    await this.timeSlotRepo.save(timeSlotsToSave);

    return this.doctorRepo.findOne({
      where: { id: savedDoctor.id },
      relations: ['user', 'timeSlots'],
    });
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

  async getProfile(userId: number) {
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'timeSlots'],
    });

    if (!doctor) {
      throw new BadRequestException('Doctor profile not found');
    }

    return doctor;
  }

  async updateProfile(userId: number, dto: UpdateDoctorProfileDto) {
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!doctor) {
      throw new BadRequestException('Doctor profile not found');
    }

    if (dto.firstName) doctor.user.firstName = dto.firstName;
    if (dto.lastName) doctor.user.lastName = dto.lastName;
    if (dto.avatar) doctor.user.avatar = dto.avatar;
    await this.userRepo.save(doctor.user);

    if (dto.bio) doctor.bio = dto.bio;
    if (dto.clinicAddress) doctor.clinicAddress = dto.clinicAddress;
    if (dto.consultationFee) doctor.consultationFee = dto.consultationFee;

    return this.doctorRepo.save(doctor);
  }

  async verifyDoctor(id: number) {
    const doctor = await this.doctorRepo.findOne({ where: { id } });
    if (!doctor) throw new BadRequestException('Doctor not found');

    doctor.isVerified = true;
    return this.doctorRepo.save(doctor);
  }

  async getDoctorTimeSlots(doctorId: number) {
    const doctor = await this.doctorRepo.findOne({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new BadRequestException('Doctor profile not found');
    }

    return this.timeSlotRepo.find({
      where: { doctor: { id: doctor.id } },
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async getDoctorTimeSlotsByUserId(userId: number) {
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!doctor) {
      throw new BadRequestException('Doctor profile not found');
    }

    return this.timeSlotRepo.find({
      where: { doctor: { id: doctor.id } , isBooked: false },
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async addTimeSlots(userId: number, dto: CreateTimeSlotDto) {
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!doctor) {
      throw new BadRequestException('Doctor profile not found');
    }

    await this.validateTimeSlots(doctor.id, dto.slots);

    const newSlots = dto.slots.flatMap((slot) =>
      slot.timeRanges.map((range) =>
        this.timeSlotRepo.create({
          doctor: { id: doctor.id },
          date: new Date(slot.date),
          startTime: new Date(range.startTime),
          endTime: new Date(range.endTime),
          isBooked: false,
        }),
      ),
    );

    return this.timeSlotRepo.save(newSlots);
  }

  async updateTimeSlot(userId: number, slotId: number, dto: UpdateTimeSlotDto) {
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!doctor) {
      throw new BadRequestException('Doctor profile not found');
    }

    const slot = await this.timeSlotRepo.findOne({
      where: { id: slotId, doctor: { id: doctor.id } },
    });

    if (!slot) {
      throw new NotFoundException('Time slot not found or access denied');
    }

    if (slot.isBooked) {
      throw new BadRequestException('Cannot edit a booked time slot');
    }

    if (dto.startTime) slot.startTime = new Date(dto.startTime);
    if (dto.endTime) slot.endTime = new Date(dto.endTime);

    const startTime = slot.startTime;
    const endTime = slot.endTime;

    const now = new Date();
    if (startTime && startTime <= now) {
      throw new BadRequestException('Cannot set a start time in the past');
    }

    const allSlots = await this.timeSlotRepo.find({
      where: { doctor: { id: doctor.id }, date: slot.date },
    });

    for (const s of allSlots) {
      if (s.id === slot.id) continue;
      if (this.isOverlapping(startTime, endTime, s.startTime, s.endTime)) {
        throw new BadRequestException(
          `Update failed: Overlaps with an existing slot on ${this.formatDate(slot.date)} (${this.formatTime(s.startTime)} - ${this.formatTime(s.endTime)})`,
        );
      }
    }

    return this.timeSlotRepo.save(slot);
  }

  private isOverlapping(s1: Date, e1: Date, s2: Date, e2: Date): boolean {
    return s1 < e2 && s2 < e1;
  }

  private async validateTimeSlots(
    doctorId: number | null,
    slots: DoctorTimeSlotDto[],
  ) {
    const seenDates = new Set<string>();

    for (const slot of slots) {
      const dateStr = new Date(slot.date).toISOString().split('T')[0];
      if (seenDates.has(dateStr)) {
        throw new BadRequestException(
          `Duplicate date entry: ${dateStr}. Please group all time ranges for the same date together.`,
        );
      }
      seenDates.add(dateStr);

      // Disallow adding slots for past dates
      const today = new Date();
      const todayDateOnly = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      const slotDateObj = new Date(slot.date);
      const slotDateOnly = new Date(
        slotDateObj.getFullYear(),
        slotDateObj.getMonth(),
        slotDateObj.getDate(),
      );
      if (slotDateOnly < todayDateOnly) {
        throw new BadRequestException(
          `Cannot add time slots for past date: ${dateStr}`,
        );
      }

      for (let i = 0; i < slot.timeRanges.length; i++) {
        const range1 = slot.timeRanges[i];
        const s1 = new Date(range1.startTime);
        const e1 = new Date(range1.endTime);

        if (s1 >= e1) {
          throw new BadRequestException(
            `Invalid time range on ${dateStr}: Start time must be before end time.`,
          );
        }

        // Disallow adding a time range that starts in the past for today's date
        const nowTime = new Date();
        if (slotDateOnly.getTime() === todayDateOnly.getTime() && s1 <= nowTime) {
          throw new BadRequestException(
            `Cannot add a time range starting in the past on ${dateStr}`,
          );
        }

        for (let j = i + 1; j < slot.timeRanges.length; j++) {
          const range2 = slot.timeRanges[j];
          const s2 = new Date(range2.startTime);
          const e2 = new Date(range2.endTime);

          if (this.isOverlapping(s1, e1, s2, e2)) {
            throw new BadRequestException(
              `Overlapping time ranges detected for ${dateStr}: ${this.formatTime(s1)}-${this.formatTime(e1)} and ${this.formatTime(s2)}-${this.formatTime(e2)}`,
            );
          }
        }

        if (doctorId) {
          const existingSlots = await this.timeSlotRepo.find({
            where: { doctor: { id: doctorId }, date: new Date(slot.date) },
          });

          for (const existing of existingSlots) {
            if (
              this.isOverlapping(s1, e1, existing.startTime, existing.endTime)
            ) {
              throw new BadRequestException(
                `Overlap with existing schedule on ${dateStr}: ${this.formatTime(s1)}-${this.formatTime(e1)} conflicts with saved slot ${this.formatTime(existing.startTime)}-${this.formatTime(existing.endTime)}`,
              );
            }
          }
        }
      }
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  async deleteTimeSlot(userId: number, slotId: number) {
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!doctor) {
      throw new BadRequestException('Doctor profile not found');
    }

    const slot = await this.timeSlotRepo.findOne({
      where: { id: slotId, doctor: { id: doctor.id } },
    });

    if (!slot) {
      throw new NotFoundException('Time slot not found or access denied');
    }

    if (slot.isBooked) {
      throw new BadRequestException('Cannot delete a booked time slot');
    }

    await this.timeSlotRepo.remove(slot);
    return { message: 'Time slot deleted successfully' };
  }

  async getAllDoctors(query?: FindDoctorQueryDto) {
    const search = query?.search;
    let where: any = { isVerified: true };

    if (search) {
      where = [
        { isVerified: true, user: { firstName: ILike(`%${search}%`) } },
        { isVerified: true, user: { lastName: ILike(`%${search}%`) } },
        { isVerified: true, user: { email: ILike(`%${search}%`) } },
        { isVerified: true, bio: ILike(`%${search}%`) },
        { isVerified: true, clinicAddress: ILike(`%${search}%`) },
      ];
    }

    return this.doctorRepo.find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAllPendingDoctors(query?: FindDoctorQueryDto) {
    const search = query?.search;
    let where: any = { isVerified: false };

    if (search) {
      where = [
        { isVerified: false, user: { firstName: ILike(`%${search}%`) } },
        { isVerified: false, user: { lastName: ILike(`%${search}%`) } },
        { isVerified: false, user: { email: ILike(`%${search}%`) } },
        { isVerified: false, bio: ILike(`%${search}%`) },
        { isVerified: false, clinicAddress: ILike(`%${search}%`) },
        { isVerified: false, licenseNumber: ILike(`%${search}%`) },
      ];
    }

    return this.doctorRepo.find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }
}
