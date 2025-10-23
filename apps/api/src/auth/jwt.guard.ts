import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

interface JwtPayload {
  sub: string;
  role?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(req);
    if (!token) return false;

    try {
      const payload = this.jwt.verify<JwtPayload>(token);
      (req as Request & { user?: JwtPayload }).user = {
        sub: payload.sub,
        role: payload.role,
      };
      return true;
    } catch {
      return false;
    }
  }

  private extractToken(req: Request): string | null {
    const authHeader = req.headers['authorization'];
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }
    return req.cookies?.['bidcars_token'] ?? null;
  }
}
