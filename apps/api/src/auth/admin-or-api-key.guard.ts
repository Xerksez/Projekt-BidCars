import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from './jwt.guard';

interface AuthUser {
  role?: 'ADMIN' | 'USER' | string;
}
interface RequestWithUser extends Request {
  user?: AuthUser;
}

@Injectable()
export class AdminOrApiKeyGuard implements CanActivate {
  constructor(
    @Inject(forwardRef(() => JwtAuthGuard))
    private readonly jwtGuard: JwtAuthGuard,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<RequestWithUser>();

    // 1) x-api-key
    const headerVal = (req.headers['x-api-key'] ?? req.headers['X-API-KEY']) as
      | string
      | string[]
      | undefined;
    const provided = Array.isArray(headerVal) ? headerVal[0] : headerVal;
    const expected = (process.env.ADMIN_API_KEY ?? '').trim();

    if (
      typeof provided === 'string' &&
      provided.trim() &&
      expected &&
      provided.trim() === expected
    ) {
      return true;
    }

    // 2) JWT + ADMIN
    try {
      const ok = await Promise.resolve(this.jwtGuard.canActivate(ctx));
      if (ok && req.user?.role === 'ADMIN') {
        return true;
      }
    } catch {
      // ignore – we'll throw Forbidden below to satisfy eslint(no-empty/no-unused-vars)
      void 0;
    }

    throw new ForbiddenException('Forbidden');
  }
}
