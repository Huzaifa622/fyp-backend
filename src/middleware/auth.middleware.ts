import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private configService: ConfigService) {}
  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    // console.log(`[AuthMiddleware] ${req.method} ${req.url}`);

    if (req.method === 'OPTIONS') {
      return next();
    }

    // console.log(
    //   `[AuthMiddleware] Authorization Header: ${authHeader ? 'Present' : 'Missing'}`,
    // );
    // console.log(`[AuthMiddleware] Full Headers:`, Object.keys(req.headers));

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }

    const [type, token] = authHeader.split(' ');
    // console.log(
    //   `[AuthMiddleware] Token Type: ${type}, Token Length: ${token?.length}`,
    // );

    if (type !== 'Bearer' || !token) {
      // console.log('[AuthMiddleware] Invalid format');
      throw new UnauthorizedException('Invalid authorization format');
    }

    try {
      const secret = this.configService.get<string>('SECRET');
      // console.log(`[AuthMiddleware] Secret configured: ${!!secret}`);

      const decoded = jwt.verify(token, secret as string);

      // console.log('[AuthMiddleware] Verification Successful', decoded);
      req['user'] = decoded;

      next();
    } catch (error) {
      console.error('[AuthMiddleware] Verification Failed:', error.message);
      throw new UnauthorizedException(error.message || 'Invalid token');
    }
  }
}
