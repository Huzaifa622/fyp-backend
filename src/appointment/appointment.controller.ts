import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppointmentService } from './appointment.service';
import { BookAppointmentDto } from './dtos/book-appointment.dto';

@ApiTags('Appointment')
@ApiBearerAuth()
@Controller('appointment')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post('book')
  @ApiOperation({ summary: 'Book an appointment with a doctor' })
  async bookAppointment(@Req() req: any, @Body() dto: BookAppointmentDto) {
    const userId = req['user']?.userId || req['user']?.id;
    return this.appointmentService.bookAppointment(userId, dto);
  }

  @Post('cancel/:id')
  @ApiOperation({ summary: 'Cancel an appointment' })
  async cancelAppointment(@Req() req: any, @Param('id') id: number) {
    const userId = req['user']?.userId || req['user']?.id;
    return this.appointmentService.cancelAppointment(userId, id);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my appointments' })
  async getMyAppointments(@Req() req: any) {
    const userId = req['user']?.userId || req['user']?.id;
    return this.appointmentService.getMyAppointments(userId);
  }
}
