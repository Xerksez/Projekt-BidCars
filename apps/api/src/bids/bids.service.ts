import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';

const MIN_INCREMENT = 100;

type CreateBidPayload = CreateBidDto & { userId: string };

@Injectable()
export class BidsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async create(input: CreateBidPayload) {
    return this.prisma.$transaction(async (tx) => {
      // 1) Walidacje bazowe
      const user = await tx.user.findUnique({
        where: { id: input.userId },
        select: { id: true },
      });
      if (!user) throw new NotFoundException('User not found');

      const auction = await tx.auction.findUnique({
        where: { id: input.auctionId },
        select: {
          id: true,
          status: true,
          startsAt: true,
          endsAt: true,
          currentPrice: true,
        },
      });
      if (!auction) throw new NotFoundException('Auction not found');

      // 2) Sprawdzenie fazy
      const now = new Date();
      const isLiveByStatus = auction.status === 'LIVE';
      const isLiveByTime = now >= auction.startsAt && now <= auction.endsAt;
      if (!(isLiveByStatus || isLiveByTime)) {
        if (now < auction.startsAt) {
          throw new BadRequestException(
            `Auction not started yet (starts at ${auction.startsAt.toISOString()})`,
          );
        }
        if (now > auction.endsAt) {
          throw new BadRequestException('Auction already ended');
        }
        throw new BadRequestException('Auction is not live');
      }

      // 3) Minimalne przebicie
      const mustBeAtLeast = Number(auction.currentPrice ?? 0) + MIN_INCREMENT;
      if (input.amount < mustBeAtLeast) {
        throw new BadRequestException(
          `Bid too low. Minimum is ${mustBeAtLeast}.`,
        );
      }

      // 4) Utworzenie oferty
      const bid = await tx.bid.create({
        data: {
          amount: input.amount,
          userId: input.userId,
          auctionId: input.auctionId,
        },
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
      });

      // 5) Aktualizacja bieżącej ceny
      await tx.auction.update({
        where: { id: input.auctionId },
        data: { currentPrice: input.amount },
      });

      // (usunięto mechanizm soft-close)

      // 6) Real-time event
      this.realtime.emitBidCreated({
        auctionId: input.auctionId,
        bidId: bid.id,
        amount: bid.amount,
        user: {
          id: bid.user.id,
          email: bid.user.email,
          name: bid.user.name,
        },
        at: bid.createdAt,
      });

      return bid;
    });
  }

  async listForAuction(auctionId: string) {
    return this.prisma.bid.findMany({
      where: { auctionId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });
  }
}
