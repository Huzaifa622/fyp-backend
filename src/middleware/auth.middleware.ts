import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization format');
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.SECRET as string,
      );

      req['user'] = decoded;

      next();
    } catch (error) {
      console.log(error)
      throw new UnauthorizedException(error);
    }
  }
}
