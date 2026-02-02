import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctors } from 'src/model/doctor.entity';

@Injectable()
export class DoctorVerifiedGuard implements CanActivate {
  constructor(
    @InjectRepository(Doctors) private readonly doctorRepo: Repository<Doctors>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      throw new ForbiddenException('User not found');
    }

    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: user.userId } },
    });

    if (!doctor) {
      throw new ForbiddenException('Doctor profile not found');
    }

    if (!doctor.isVerified) {
      throw new ForbiddenException(
        'Doctor account is not verified yet. Please wait for admin verification.',
      );
    }

    return true;
  }
}
