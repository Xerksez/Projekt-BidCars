// apps/api/src/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateUserDto } from './dto/create-user.dto';
import { Prisma, Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' }, // lub created_at
      take: 100,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true, // dopasuj do schematu
        updatedAt: true, // dopasuj do schematu
        _count: {
          select: {
            bids: true, // jw.
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true, // lub created_at
        updatedAt: true, // lub updated_at
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(input: CreateUserDto) {
    try {
      const created = await this.prisma.user.create({
        data: {
          email: input?.email?.toLowerCase().trim(),
          name: input?.name ?? null,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return created;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BadRequestException('Email must be unique');
      }
      throw e;
    }
  }

  async updateRole(id: string, role: Role) {
    const updated = await this.prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return updated;
  }
}
