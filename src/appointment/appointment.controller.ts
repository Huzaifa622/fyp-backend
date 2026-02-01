import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AppointmentService } from './appointment.service';
import { BookAppointmentDto } from './dtos/book-appointment.dto';
import { GetUser } from 'src/users/decorators/get-user.decorator';
import { Appointment } from 'src/model/appointment.entity';

@ApiTags('Appointment')
@ApiBearerAuth()
@Controller('appointment')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post('book')
  @ApiOperation({ summary: 'Book an appointment with a doctor' })
  @ApiResponse({
    status: 201,
    description: 'Appointment booked successfully',
    type: Appointment,
  })
  @ApiResponse({ status: 400, description: 'Slot already booked or invalid' })
  @ApiResponse({ status: 404, description: 'Doctor or slot not found' })
  async bookAppointment(
    @GetUser() user: { userId: number },
    @Body() dto: BookAppointmentDto,
  ) {
    const userId = user.userId;
    return this.appointmentService.bookAppointment(userId, dto);
  }

  @Post('cancel/:id')
  @ApiOperation({ summary: 'Cancel an appointment' })
  @ApiResponse({
    status: 200,
    description: 'Appointment cancelled successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Already cancelled or unauthorized',
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async cancelAppointment(
    @GetUser() user: { userId: number },
    @Param('id') id: number,
  ) {
    const userId = user.userId;
    return this.appointmentService.cancelAppointment(userId, id);
  }

  @Post('complete/:id')
  @ApiOperation({ summary: 'Mark an appointment as completed' })
  @ApiResponse({
    status: 200,
    description: 'Appointment completed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot complete cancelled/already completed appointment',
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async completeAppointment(
    @GetUser() user: { userId: number },
    @Param('id') id: number,
  ) {
    const userId = user.userId;
    return this.appointmentService.completeAppointment(userId, id);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my appointments' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of appointments',
    type: [Appointment],
  })
  async getMyAppointments(@GetUser() user: { userId: number }) {
    const userId = user.userId;
    return this.appointmentService.getMyAppointments(userId);
  }

  @Get('doctor')
  @ApiOperation({ summary: 'Get doctor appointments' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of appointments for the doctor',
    type: [Appointment],
  })
  async getDoctorAppointments(@GetUser() user: { userId: number }) {
    const userId = user.userId;
    return this.appointmentService.getDoctorAppointments(userId);
  }
}
