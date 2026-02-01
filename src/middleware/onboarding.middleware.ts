import {
  Injectable,
  NestMiddleware,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctors } from '../model/doctor.entity';
import { Patients } from '../model/patient.entity';

@Injectable()
export class OnboardingMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(Doctors)
    private readonly doctorRepo: Repository<Doctors>,
    @InjectRepository(Patients)
    private readonly patientRepo: Repository<Patients>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const user = req['user'];

    if (!user) {
      next(); // Should be handled by AuthMiddleware
      return;
    }

    const userId = user.userId || user.id;

    if (user.role === 'doctor') {
      const doctor = await this.doctorRepo.findOne({
        where: { user: { id: userId } },
      });
      if (!doctor && !req.url.includes('/onboard')) {
        throw new ForbiddenException(
          'Doctor must complete onboarding before accessing this route',
        );
      }
    } else if (user.role === 'patient') {
      const patient = await this.patientRepo.findOne({
        where: { user: { id: userId } },
      });
      if (!patient && !req.url.includes('/onboard')) {
        throw new ForbiddenException(
          'Patient must complete onboarding before accessing this route',
        );
      }
    }

    next();
  }
}
