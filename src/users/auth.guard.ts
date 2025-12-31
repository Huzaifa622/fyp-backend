import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Observable } from "rxjs";

@Injectable()

export class AuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService
    ) { }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const req = context.switchToHttp().getRequest();

        // Allow public verification endpoint
        if (req.method === 'GET' && req.url && req.url.startsWith('/users/verify')) {
            return true;
        }

        const token = req.headers.authorization?.replace('Bearer ', '')

        if(!token) return false

        try {
            const decoded = this.jwtService.verify(token);
            req.user = decoded

            return true
        } catch (error) {
            return false
        }
    }

    
}