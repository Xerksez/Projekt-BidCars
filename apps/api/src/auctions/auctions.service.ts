import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import type { ListAuctionsDto } from './dto/list-auctions.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonArray;
interface JsonObject {
  [key: string]: JsonValue;
}
type JsonArray = JsonValue[];

/** Rekurencyjna konwersja BigInt -> number w całym drzewie obiektu */
function convertBigIntDeep(val: unknown): JsonValue {
  if (typeof val === 'bigint') return Number(val);
  if (val === null) return null;
  if (Array.isArray(val)) return val.map((v) => convertBigIntDeep(v));
  if (typeof val === 'object') {
    const out: JsonObject = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      out[k] = convertBigIntDeep(v);
    }
    return out;
  }
  // liczby / stringi / bool
  if (
    typeof val === 'string' ||
    typeof val === 'number' ||
    typeof val === 'boolean'
  ) {
    return val;
  }
  // wszystko inne (np. undefined) nie jest legalnym JSON — zamieńmy na null
  return null;
}
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async stats() {
    const now = new Date();

    const [total, cancelled, ended, live, scheduled] =
      await this.prisma.$transaction([
        this.prisma.auction.count(),
        this.prisma.auction.count({ where: { status: 'CANCELLED' } }),
        this.prisma.auction.count({
          where: { status: { not: 'CANCELLED' }, endsAt: { lte: now } },
        }),
        this.prisma.auction.count({
          where: {
            status: { not: 'CANCELLED' },
            startsAt: { lte: now },
            endsAt: { gt: now },
          },
        }),
        this.prisma.auction.count({
          where: { status: { not: 'CANCELLED' }, startsAt: { gt: now } },
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
          where.status = 'CANCELLED';
          break;
      }
    } else if (q?.excludeEnded === '1') {
      where.endsAt = { gt: now };
    }

    if (q?.search && q.search.trim()) {
      where.OR = [
        { title: { contains: q.search, mode: 'insensitive' } },
        { vin: { contains: q.search, mode: 'insensitive' } },
      ];
    }

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
        // UŻYWAMY include (nie select), by mieć relację photos w typach:
        include: {
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
      coverUrl: a.photos?.[0]?.url ?? null,
    }));

    return convertBigIntDeep({
      items,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  }

  async findOne(id: string) {
    const auction = await this.prisma.auction.findUnique({ where: { id } });
    if (!auction) throw new NotFoundException('Auction not found');
    return convertBigIntDeep({ ...auction, status: computeStatus(auction) });
  }

  create(input: {
    title: string;
    vin?: string | null;
    startsAt: string;
    endsAt: string;
    currentPrice?: number;
  }) {
    const { title, vin, startsAt, endsAt, currentPrice = 0 } = input;

    return this.prisma.auction
      .create({
        data: {
          title,
          vin: vin ?? null,
          startsAt: new Date(startsAt),
          endsAt: new Date(endsAt),
          currentPrice,
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
      const updated = await this.prisma.auction.update({ where: { id }, data });

      // realtime przy zmianie statusu
      type RTStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
      if (typeof input.status === 'string') {
        const status = updated.status as RTStatus;
        this.realtime.emitAuctionStatus({
          auctionId: id,
          status,
          startsAt: updated.startsAt,
          endsAt: updated.endsAt,
          currentPrice:
            typeof updated.currentPrice === 'number'
              ? updated.currentPrice
              : undefined,
        });
      }

      return updated;
    } catch {
      throw new NotFoundException('Auction not found');
    }
  }

  async setStatus(
    id: string,
    status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED',
  ) {
    const updated = await this.prisma.auction.update({
      where: { id },
      data: { status },
    });

    this.realtime.emitAuctionStatus({
      auctionId: id,
      status: updated.status as 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED',
      startsAt: updated.startsAt,
      endsAt: updated.endsAt,
      currentPrice:
        typeof updated.currentPrice === 'number'
          ? updated.currentPrice
          : undefined,
    });

    return updated;
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
