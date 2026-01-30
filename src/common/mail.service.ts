import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST'),
      port: +this.config.get('SMTP_PORT'),
      secure: false, // true if port 465
      auth: {
        user: this.config.get('SMTP_USER'),
        pass: this.config.get('SMTP_PASS'),
      },
    });
  }

  async sendVerification(email: string, token: string) {
    const backend =
      this.config.get('BACKEND_URL') ?? this.config.get('APP_URL');
    const verifyUrl = `${backend}/users/verify?token=${token}`;

    await this.transporter.sendMail({
      from: `"No Reply" <${this.config.get('SMTP_USER')}>`,
      to: email,
      subject: 'Verify your email',
      html: `Click <a href="${verifyUrl}">here</a> to verify your email. Link valid for 24 hours.`,
    });
  }

  async sendAppointmentConfirmation(
    to: string,
    patientName: string,
    doctorName: string,
    date: Date,
  ) {
    await this.transporter.sendMail({
      from: `"No Reply" <${this.config.get('SMTP_USER')}>`,
      to,
      subject: 'Appointment Confirmation',
      text: `Dear ${patientName},\n\nYour appointment with Dr. ${doctorName} has been confirmed for ${date.toLocaleString()}.\n\nThank you.`,
    });
  }

  async sendDoctorNotification(
    to: string,
    doctorName: string,
    patientName: string,
    date: Date,
  ) {
    await this.transporter.sendMail({
      from: `"No Reply" <${this.config.get('SMTP_USER')}>`,
      to,
      subject: 'New Appointment Booking',
      text: `Dear Dr. ${doctorName},\n\nYou have a new appointment with patient ${patientName} on ${date.toLocaleString()}.\n\nPlease check your dashboard for details.`,
    });
  }
}
