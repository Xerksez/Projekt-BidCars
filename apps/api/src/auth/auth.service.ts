import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';

export type PublicUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: Date;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private toPublic(u: {
    id: string;
    email: string;
    name: string | null;
    role: Role;
    createdAt: Date;
  }): PublicUser {
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt,
    };
  }

  async register(
    email: string,
    password: string,
    name?: string | null,
  ): Promise<PublicUser> {
    this.logger.debug(`register: email=${email}`);

    const exists = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (exists) {
      this.logger.warn(`register: email in use ${email}`);
      throw new BadRequestException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        name: name ?? null,
        passwordHash,
        role: Role.USER,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    this.logger.debug(`register OK: uid=${user.id} role=${user.role}`);
    return this.toPublic(user);
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ token: string; user: PublicUser }> {
    this.logger.debug(`login: email=${email}`);

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        passwordHash: true,
      },
    });

    if (!user?.passwordHash) {
      this.logger.warn(`login fail: no user or no hash for ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      this.logger.warn(`login fail: bad password for ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.jwt.signAsync({ sub: user.id, role: user.role });
    this.logger.debug(`login OK: uid=${user.id} role=${user.role}`);

    const pub: PublicUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };

    return { token, user: pub };
  }

  async me(userId: string): Promise<PublicUser> {
    this.logger.debug(`me: uid=${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      this.logger.warn(`me fail: user not found uid=${userId}`);
      throw new UnauthorizedException('User not found');
    }

    this.logger.debug(`me OK: uid=${user.id} role=${user.role}`);
    return this.toPublic(user);
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, role: true },
    });
  }
}
