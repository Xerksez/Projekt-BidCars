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
  const starts = new Date(a.startsAt).getTime();
  const ends = new Date(a.endsAt).getTime();
  if (now < starts) return 'SCHEDULED';
  if (now >= ends) return 'ENDED';
  return 'LIVE';
}

@Injectable()
export class AuctionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q?: ListAuctionsDto) {
    const page = Math.max(1, q?.page ?? 1);
    const limit = Math.min(50, Math.max(1, q?.limit ?? 10));
    const skip = (page - 1) * limit;

    const now = new Date();

    // Budujemy warunki bez `any`
    const and: Prisma.AuctionWhereInput[] = [];
    const or: Prisma.AuctionWhereInput[] = [];

    // Szukanie po tytule/VIN (case-insensitive)
    if (q?.search) {
      or.push({
        title: { contains: q.search, mode: 'insensitive' },
      });
      or.push({
        vin: { contains: q.search, mode: 'insensitive' },
      });
    }

    // Filtr statusu — po CZASIE (a nie po kolumnie),
    // wyjątek: CANCELLED filtrujemy po kolumnie
    switch (q?.status) {
      case 'SCHEDULED':
        and.push({ startsAt: { gt: now } }, { status: { not: 'CANCELLED' } });
        break;
      case 'LIVE':
        and.push(
          { startsAt: { lte: now } },
          { endsAt: { gt: now } },
          { status: { not: 'CANCELLED' } },
        );
        break;
      case 'ENDED':
        and.push({ endsAt: { lte: now } }, { status: { not: 'CANCELLED' } });
        break;
      case 'CANCELLED':
        and.push({ status: 'CANCELLED' });
        break;
      default:
      // brak statusu → nic nie dodajemy (pokaż wszystkie)
    }

    const where: Prisma.AuctionWhereInput = {
      ...(and.length ? { AND: and } : {}),
      ...(or.length ? { OR: or } : {}),
    };

    const sortField = (q?.sort ??
      'endsAt') as keyof Prisma.AuctionOrderByWithRelationInput;
    const sortOrder = (q?.order ?? 'asc') as Prisma.SortOrder;
    const orderBy: Prisma.AuctionOrderByWithRelationInput = {
      [sortField]: sortOrder,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auction.findMany({ where, orderBy, skip, take: limit }),
      this.prisma.auction.count({ where }),
    ]);

    return {
      items: items.map((a) => ({ ...a, status: computeStatus(a) })),
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
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
