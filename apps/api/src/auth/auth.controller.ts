import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  UseGuards,
  Req,
  Logger,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
// ⬇️ KLUCZOWE: import type
import type { Response, Request } from 'express';

import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

import { JwtAuthGuard } from './jwt.guard';
import { JwtService } from '@nestjs/jwt';

const COOKIE_NAME = 'bidcars_token';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    private readonly auth: AuthService,
    private readonly jwt: JwtService,
  ) {}

  @Post('register')
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.logger.log(`register start email=${body.email}`);
    const user = await this.auth.register(body.email, body.password, body.name);
    const result = await this.auth.login(body.email, body.password);
    res.cookie(COOKIE_NAME, result.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 7 * 24 * 3600 * 1000,
      path: '/',
    });
    this.logger.log(`register ok uid=${user.id} cookie set`);
    return { user };
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    // ⬇️ tu było: const { user, accessToken } = ...
    const { user, token } = await this.auth.login(dto.email, dto.password);

    // cookie dla frontu (bez zmian – tylko użyjemy 'token')
    res.cookie('bidcars_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600 * 1000,
    });

    // zwrotka dla Swaggera/Postmana (żeby mieć Bearer)
    return {
      access_token: token, // <-- ważne: klucz 'access_token' dla standardu
      user, // np. { id, email, role, name }
    };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    this.logger.log('logout ok cookie cleared');
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  me(@Req() req: Request) {
    // @ts-expect-error – dodane przez guard
    const uid = req.user?.sub;
    this.logger.debug(`me ok uid=${uid}`);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return this.auth.me(req.user.sub);
  }
}
