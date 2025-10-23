// apps/api/src/auth/api-key.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const provided = req.header('x-api-key');
    const expected = this.config.get<string>('ADMIN_API_KEY');

    if (!expected) {
      throw new UnauthorizedException('API key not configured');
    }
    if (!provided || provided !== expected) {
      throw new ForbiddenException('Invalid API key');
    }
    return true;
  }
}
