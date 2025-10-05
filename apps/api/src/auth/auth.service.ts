// apps/api/src/auth/auth.service.ts
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

// ⬇️ dopisz/upewnij typy pomocnicze
export type PublicUser = {
  id: string;
  email: string;
  name?: string | null;
  role: 'USER' | 'ADMIN';
};

export type AuthLoginResult = {
  token: string;
  user: PublicUser;
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  private toPublic(u: {
    id: string;
    email: string;
    name: string | null;
    role: 'USER' | 'ADMIN';
  }): PublicUser {
    return { id: u.id, email: u.email, name: u.name, role: u.role };
  }

  // ⬇️ sygnatura register – zwraca PublicUser
  async register(
    email: string,
    password: string,
    name?: string | null,
  ): Promise<PublicUser> {
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new BadRequestException('Email already in use');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email, name: name ?? null, passwordHash, role: 'USER' },
      select: { id: true, email: true, name: true, role: true },
    });

    return this.toPublic(user);
  }

  // ⬇️ sygnatura login – ZWRACA { token, user }
  async login(email: string, password: string): Promise<AuthLoginResult> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: true,
      },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, role: user.role };
    const token = await this.jwt.signAsync(payload, { expiresIn: '7d' });

    return { token, user: this.toPublic(user) };
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!user) throw new UnauthorizedException();
    return this.toPublic(user);
  }
}
