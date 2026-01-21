import { Appointment } from './appointment.entity';
import { Doctors } from './doctor.entity';
import { Patients } from './patient.entity';
import { TimeSlots } from './time-slot.entity';
import { Users } from './user.entity';

const entities = [Users, Doctors, Appointment, Patients, TimeSlots];

export default entities;
