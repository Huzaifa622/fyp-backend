import { BadRequestException, Body, Controller, Post, Res } from '@nestjs/common';
import { UsersService } from './users.service';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { Response } from 'express';
import { GoogleOauthDto } from './dtos/google-oauth.dto';

@Controller('auth')
export class AuthController {
  constructor(private usersService: UsersService, private config: ConfigService) {}

  @Post('google')
  async googleAuth(@Body() dto: GoogleOauthDto) {
    const client = new OAuth2Client(this.config.get('GOOGLE_CLIENT_ID'));
    let payload:any;

    try {
      const ticket = await client.verifyIdToken({ idToken: dto.idToken, audience: this.config.get('GOOGLE_CLIENT_ID') });
      payload = ticket.getPayload();
    } catch (e) {
      throw new BadRequestException('Invalid Google ID token');
    }

    if (!payload?.email) throw new BadRequestException('Google token did not contain an email');

    const user = await this.usersService.upsertGoogleUser(payload as any);
    const token = this.usersService.createJwtForUser(user);

    return { token };
  }
}
