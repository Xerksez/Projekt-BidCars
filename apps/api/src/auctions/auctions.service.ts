import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import type { ListAuctionsDto } from './dto/list-auctions.dto';

type AuctionStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';

function computeStatus(a: {
  startsAt: Date | string;
  endsAt: Date | string;
  status?: AuctionStatus;
}): AuctionStatus {
  if (a.status === 'CANCELLED') return 'CANCELLED';
  const now = Date.now();
  const s = new Date(a.startsAt).getTime();
  const e = new Date(a.endsAt).getTime();
  if (now < s) return 'SCHEDULED';
  if (now >= e) return 'ENDED';
  return 'LIVE';
}

@Injectable()
export class AuctionsService {
  constructor(private readonly prisma: PrismaService) {}

  async stats() {
    const now = new Date();

    const [total, cancelled, ended, live, scheduled] =
      await this.prisma.$transaction([
        // wszystkie
        this.prisma.auction.count(),
        // anulowane (osobno)
        this.prisma.auction.count({
          where: { status: 'CANCELLED' },
        }),
        // zakończone (bez anulowanych)
        this.prisma.auction.count({
          where: {
            status: { not: 'CANCELLED' },
            endsAt: { lte: now },
          },
        }),
        // live (bez anulowanych)
        this.prisma.auction.count({
          where: {
            status: { not: 'CANCELLED' },
            startsAt: { lte: now },
            endsAt: { gt: now },
          },
        }),
        // scheduled/przyszłe (bez anulowanych)
        this.prisma.auction.count({
          where: {
            status: { not: 'CANCELLED' },
            startsAt: { gt: now },
          },
        }),
      ]);

    const active = live + scheduled;

    return { total, active, live, scheduled, ended, cancelled };
  }

  async list(q?: ListAuctionsDto) {
    const page = Math.max(1, q?.page ?? 1);
    const limit = Math.min(50, Math.max(1, q?.limit ?? 10));
    const skip = (page - 1) * limit;

    const where: Prisma.AuctionWhereInput = {};
    const now = new Date();

    // ---- STATUS → CZAS ----
    if (q?.status) {
      switch (q.status) {
        case 'SCHEDULED':
          where.startsAt = { gt: now };
          break;
        case 'LIVE':
          where.startsAt = { lte: now };
          where.endsAt = { gt: now };
          break;
        case 'ENDED':
          where.endsAt = { lte: now };
          break;
        case 'CANCELLED':
          // tylko po kolumnie – anulacje ustawiasz ręcznie
          where.status = 'CANCELLED';
          break;
        default:
          // nieznany status – nic nie filtrujemy
          break;
      }
    } else {
      // ---- WIDOK "AKTYWNE" (LIVE+SCHEDULED) ----
      if (q?.excludeEnded === '1') {
        where.endsAt = { gt: now };
      }
    }

    // ---- SEARCH ----
    if (q?.search && q.search.trim()) {
      where.OR = [
        { title: { contains: q.search, mode: 'insensitive' } },
        { vin: { contains: q.search, mode: 'insensitive' } },
      ];
    }

    // ---- SORT ----
    const sortField = (q?.sort ??
      'endsAt') as keyof Prisma.AuctionOrderByWithRelationInput;
    const sortOrder = (q?.order ?? 'asc') as Prisma.SortOrder;
    const orderBy: Prisma.AuctionOrderByWithRelationInput = {
      [sortField]: sortOrder,
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.auction.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          vin: true,
          startsAt: true,
          endsAt: true,
          currentPrice: true,
          softCloseSec: true,
          createdAt: true,
          updatedAt: true,
          status: true,
          source: true,
          sourceId: true,
          sourceUrl: true,
          raw: true,
          // ⬇️ ZMIEN NA WŁAŚCIWĄ NAZWĘ RELACJI (np. photos, auctionPhotos, auctionphoto)
          photos: {
            select: { url: true },
            orderBy: { createdAt: 'asc' },
            take: 1,
          },
        },
      }),
      this.prisma.auction.count({ where }),
    ]);

    const items = rows.map((a) => ({
      ...a,
      status: computeStatus(a),
      coverUrl: a.photos?.[0]?.url ?? null, // ⬅️ miniatura
    }));

    return {
      items: items.map((a) => ({ ...a, status: computeStatus(a) })),
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const auction = await this.prisma.auction.findUnique({ where: { id } });
    if (!auction) throw new NotFoundException('Auction not found');
    return { ...auction, status: computeStatus(auction) };
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

  async update(id: string, input: UpdateAuctionDto) {
    const data: Record<string, unknown> = { ...input };

    if (typeof data.startsAt === 'string')
      data.startsAt = new Date(data.startsAt as string);
    if (typeof data.endsAt === 'string')
      data.endsAt = new Date(data.endsAt as string);

    try {
      return await this.prisma.auction.update({ where: { id }, data });
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
