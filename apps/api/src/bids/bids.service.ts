import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';

const MIN_INCREMENT = 100;

@Injectable()
export class BidsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway, 
  ) {}

  async create(input: CreateBidDto) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: input.userId } });
      if (!user) throw new NotFoundException('User not found');

      const auction = await tx.auction.findUnique({
        where: { id: input.auctionId },
      });
      if (!auction) throw new NotFoundException('Auction not found');

      const now = new Date();

      if (now < auction.startsAt) {
        throw new BadRequestException(
          `Auction not started yet (starts at ${auction.startsAt.toISOString()})`,
        );
      }
      if (now > auction.endsAt) {
        throw new BadRequestException('Auction already ended');
      }

      const mustBeAtLeast = auction.currentPrice + MIN_INCREMENT;
      if (input.amount < mustBeAtLeast) {
        throw new BadRequestException(
          `Bid too low. Minimum is ${mustBeAtLeast}.`,
        );
      }

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

      await tx.auction.update({
        where: { id: input.auctionId },
        data: { currentPrice: input.amount },
      });

      // ... po update currentPrice:
      const endsAt = new Date(auction.endsAt);
      const diffSec = Math.floor((endsAt.getTime() - now.getTime()) / 1000);

      if (diffSec <= auction.softCloseSec) {
        const newEndsAt = new Date(
          endsAt.getTime() + auction.softCloseSec * 1000,
        );

        await tx.auction.update({
          where: { id: input.auctionId },
          data: { endsAt: newEndsAt },
        });

        // opcjonalnie realtime event o przedłużeniu (patrz 2)
        this.realtime.emitAuctionExtended?.({
          auctionId: input.auctionId,
          endsAt: newEndsAt.toISOString(),
          extendedBySec: auction.softCloseSec,
        });
      }

      // ⬇️ realtime event
      this.realtime.emitBidCreated({
        auctionId: input.auctionId,
        bidId: bid.id,
        amount: bid.amount,
        user: { id: bid.user.id, email: bid.user.email, name: bid.user.name },
        at: bid.createdAt,
      });

      return bid;
    });
  }

  async listForAuction(auctionId: string) {
    return this.prisma.bid.findMany({
      where: { auctionId },
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });
  }
}
