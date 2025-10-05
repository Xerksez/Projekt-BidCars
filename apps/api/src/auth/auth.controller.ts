import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
// ⬇️ KLUCZOWE: import type
import type { Response, Request } from 'express';

import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

import { JwtAuthGuard } from './jwt.guard';

const COOKIE_NAME = 'bidcars_token';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.auth.register(body.email, body.password, body.name);
    // auto-login po rejestracji
    const result = await this.auth.login(body.email, body.password);
    res.cookie(COOKIE_NAME, result.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // prod: true
      maxAge: 7 * 24 * 3600 * 1000,
      path: '/',
    });
    return { user };
  }

  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(body.email, body.password);
    res.cookie(COOKIE_NAME, result.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // prod: true
      maxAge: 7 * 24 * 3600 * 1000,
      path: '/',
    });
    return { user: result.user };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  me(@Req() req: Request) {
    // user jest dokładany przez guard (typowo: { sub, role })
    // @ts-expect-error – dodane przez guard
    return this.auth.me(req.user.sub);
  }
}
