import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Doctors } from 'src/model/doctor.entity';
import { TimeSlots } from 'src/model/time-slot.entity';
import { Repository } from 'typeorm';
import { CreateTimeSlotDto } from './dtos/create-time-slot.dto';
import { OnBoardingDoctorDto } from './dtos/onboarding-doctor.dto';

import { Users } from 'src/model/user.entity';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctors) private readonly doctorRepo: Repository<Doctors>,
    @InjectRepository(TimeSlots)
    private readonly timeSlotRepo: Repository<TimeSlots>,
    @InjectRepository(Users)
    private readonly userRepo: Repository<Users>,
    private configService: ConfigService,
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

    const doctor = this.doctorRepo.create({
      licenseNumber: dto.licenseNumber,
      experienceYears: dto.experienceYears,
      consultationFee: dto.consultationFee,
      bio: dto.bio,
      clinicAddress: dto.clinicAddress,
      user: { id: userId },
      isVerified: false, // Explicitly false until admin verifies
      degreePath: files.degree?.[0]?.path,
      certificatePath: files.certificate?.[0]?.path,

      timeSlots: dto.timeSlots.map((slot) => ({
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

  async getDoctorTimeSlots(doctorId: number) {
    const today = new Date();
    // Reset time to 00:00:00 for strict date matching if needed, or pass date string.
    // TypeORM handled local date vs UTC carefully.
    // Assuming 'date' column is stored as 'YYYY-MM-DD'.

    // Simplest way: Filter by date range or specific date string.
    // Let's rely on finding slots where date >= today (or strictly today as requested).
    // Prompt: "date always current date means patient see doctor all current date time slot" -> strictly TODAY.

    const todayStr = today.toISOString().split('T')[0];

    return this.timeSlotRepo
      .createQueryBuilder('slot')
      .where('slot.doctor_id = :doctorId', { doctorId })
      .andWhere('slot.is_booked = :isBooked', { isBooked: false })
      .andWhere('slot.date = :today', { today: todayStr })
      .orderBy('slot.start_time', 'ASC')
      .getMany();
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
