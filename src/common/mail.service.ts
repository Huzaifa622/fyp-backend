import { Injectable, Logger } from '@nestjs/common';
import sgMail from '@sendgrid/mail';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('SENDGRID_API_KEY');
    if (apiKey) {
      sgMail.setApiKey(apiKey);
    } else {
      this.logger.warn(
        'SENDGRID_API_KEY is not defined in environment variables',
      );
    }
  }

  async sendVerification(email: string, token: string) {
    const backend =
      this.config.get('BACKEND_URL') ?? this.config.get('APP_URL');
    const verifyUrl = `${backend}/users/verify?token=${token}`;
    const from = this.config.get<string>('SENDGRID_FROM_EMAIL');

    if (!from) {
      this.logger.error('SENDGRID_FROM_EMAIL is not defined');
      return;
    }

    const msg = {
      to: email,
      from,
      subject: 'Verify your email',
      html: `Click <a href="${verifyUrl}">here</a> to verify your email. Link valid for 24 hours.`,
    };

    try {
      await sgMail.send(msg);
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Error sending verification email to ${email}`,
        error.response?.body || error,
      );
    }
  }

  async sendAppointmentConfirmation(
    to: string,
    patientName: string,
    doctorName: string,
    date: Date,
  ) {
    const from = this.config.get<string>('SENDGRID_FROM_EMAIL');

    if (!from) {
      this.logger.error('SENDGRID_FROM_EMAIL is not defined');
      return;
    }

    const msg = {
      to,
      from,
      subject: 'Appointment Confirmation',
      text: `Dear ${patientName},\n\nYour appointment with Dr. ${doctorName} has been confirmed for ${date.toLocaleString()}.\n\nThank you.`,
    };

    try {
      await sgMail.send(msg);
      this.logger.log(`Appointment confirmation sent to ${to}`);
    } catch (error) {
      this.logger.error(
        `Error sending appointment confirmation to ${to}`,
        error.response?.body || error,
      );
    }
  }

  async sendDoctorNotification(
    to: string,
    doctorName: string,
    patientName: string,
    date: Date,
  ) {
    const from = this.config.get<string>('SENDGRID_FROM_EMAIL');

    if (!from) {
      this.logger.error('SENDGRID_FROM_EMAIL is not defined');
      return;
    }

    const msg = {
      to,
      from,
      subject: 'New Appointment Booking',
      text: `Dear Dr. ${doctorName},\n\nYou have a new appointment with patient ${patientName} on ${date.toLocaleString()}.\n\nPlease check your dashboard for details.`,
    };

    try {
      await sgMail.send(msg);
      this.logger.log(`Doctor notification sent to ${to}`);
    } catch (error) {
      this.logger.error(
        `Error sending doctor notification to ${to}`,
        error.response?.body || error,
      );
    }
  }
}
