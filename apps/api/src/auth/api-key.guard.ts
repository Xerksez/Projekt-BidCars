import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request & { headers: Record<string, string | undefined> }>();
    const provided = (req.headers['x-api-key'] ?? req.headers['X-API-KEY'] ?? '') as string;
    const expected = process.env.ADMIN_API_KEY;
    if (!expected) {
     
      throw new UnauthorizedException('Missing ADMIN_API_KEY on server');
    }
    if (!provided || provided !== expected) {
      throw new UnauthorizedException('Invalid API key');
    }
    return true;
  }
}
