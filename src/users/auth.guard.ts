import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Observable } from "rxjs";

@Injectable()

export class AuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService
    ) { }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const req = context.switchToHttp().getRequest();

        // // Allow public verification endpoint
        // if (req.method === 'GET' && req.url && req.url.startsWith('/users/verify')) {
        //     return true;
        // }

        const authHeader = req.headers.authorization;
        if (!authHeader) return false;
        const parts = authHeader.split(' ');
        const token = parts.length === 2 ? parts[1] : authHeader.replace(/bearer\s/i, '');

        if (!token) {
            throw new UnauthorizedException("Unauthorized")
        }
        try {
            const decoded = this.jwtService.verify(token);
            req.user = decoded

            return true
        } catch (error) {
            return false
        }
    }


}