import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuctionsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.auction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findOne(id: string) {
    const auction = await this.prisma.auction.findUnique({ where: { id } });
    if (!auction) throw new NotFoundException('Auction not found');
    return auction;
  }

  create(input: {
    title: string;
    vin?: string | null;
    startsAt: string;
    endsAt: string;
    currentPrice?: number;
    softCloseSec?: number;
  }) {
    const {
      title,
      vin,
      startsAt,
      endsAt,
      currentPrice = 0,
      softCloseSec = 120,
    } = input;
    return this.prisma.auction
      .create({
        data: {
          title,
          vin: vin ?? null,
          startsAt: new Date(startsAt),
          endsAt: new Date(endsAt),
          currentPrice,
          softCloseSec,
        },
      })
      .catch((e: unknown) => {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        ) {
          throw new BadRequestException('VIN must be unique');
        }
        throw e;
      });
  }

  async update(
    id: string,
    input: Partial<{
      title: string;
      vin?: string | null;
      startsAt: string;
      endsAt: string;
      currentPrice?: number;
      softCloseSec?: number;
    }>,
  ) {
    // poprawne typowanie zamiast any
    const data: Record<string, unknown> = { ...input };

    if (data.startsAt && typeof data.startsAt === 'string') {
      data.startsAt = new Date(data.startsAt);
    }
    if (data.endsAt && typeof data.endsAt === 'string') {
      data.endsAt = new Date(data.endsAt);
    }

    try {
      return await this.prisma.auction.update({
        where: { id },
        data,
      });
    } catch {
      throw new NotFoundException('Auction not found');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.auction.delete({ where: { id } });
      return { ok: true };
    } catch {
      throw new NotFoundException('Auction not found');
    }
  }
}
