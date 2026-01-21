import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Doctors } from 'src/model/doctor.entity';
import { TimeSlots } from 'src/model/time-slot.entity';
import { Repository } from 'typeorm';
import { CreateTimeSlotDto } from './dtos/create-time-slot.dto';
import { OnBoardingDoctorDto } from './dtos/onboarding-doctor.dto';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctors) private readonly doctorRepo: Repository<Doctors>,
    @InjectRepository(TimeSlots)
    private readonly timeSlotRepo: Repository<TimeSlots>,
    private configService: ConfigService,
  ) {}

  async onboard(userId: number, dto: OnBoardingDoctorDto) {
    const existingDoctor = await this.doctorRepo.findOne({
      where: { user: { id: userId } },
    });

    if (existingDoctor) {
      throw new BadRequestException('Doctor already onboarded');
    }

    const doctor = this.doctorRepo.create({
      ...dto,
      user: { id: userId },
    });

    return this.doctorRepo.save(doctor);
  }

  async getDoctorById(id: number) {
    const doctor = await this.doctorRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!doctor) {
      throw new BadRequestException('Doctor not found');
    }

    return doctor;
  }

  async createTimeSlot(userId: number, dto: CreateTimeSlotDto) {
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!doctor) {
      throw new BadRequestException('Doctor not found');
    }

    const timeSlot = this.timeSlotRepo.create({
      ...dto,
      doctor,
    });

    return this.timeSlotRepo.save(timeSlot);
  }

  async getDoctorTimeSlots(doctorId: number) {
    return this.timeSlotRepo.find({
      where: { doctor: { id: doctorId } },
      order: { startTime: 'ASC' },
    });
  }
}
