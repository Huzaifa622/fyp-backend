import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Doctors } from 'src/model/doctor.entity';
import { Repository } from 'typeorm';
import { OnBoardingDoctorDto } from './dtos/onboarding-doctor.dto';

@Injectable()
export class DoctorService {
      constructor(@InjectRepository(Doctors) private readonly doctorRepo: Repository<Doctors>, private configService: ConfigService, ) { }

    async onboard(userId: number, dto: OnBoardingDoctorDto) {
  const existingDoctor = await this.doctorRepo.findOne({
    where: { user: { id: userId } }
  });

  if (existingDoctor) {
    throw new BadRequestException('Doctor already onboarded');
  }

  const doctor = this.doctorRepo.create({
    ...dto,
    user: { id: userId }
  });

  return this.doctorRepo.save(doctor);
}

}
