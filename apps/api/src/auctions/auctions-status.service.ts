import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class AuctionsStatusService {
  private readonly logger = new Logger(AuctionsStatusService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  // co 30 sekund
  @Cron('*/30 * * * * *')
  async recalcStatuses() {
    const now = new Date();

    // 1) UPCOMING -> LIVE
    const toLive = await this.prisma.auction.findMany({
      where: {
        status: 'SCHEDULED',
        startsAt: { lte: now },
        endsAt: { gt: now },
      },
      select: { id: true },
    });
    if (toLive.length) {
      await this.prisma.auction.updateMany({
        where: { id: { in: toLive.map((a) => a.id) } },
        data: { status: 'LIVE' },
      });
      toLive.forEach((a) =>
        this.realtime.emitAuctionStatus?.({ auctionId: a.id, status: 'LIVE' }),
      );
    }

    // 2) LIVE -> ENDED
    const toEnded = await this.prisma.auction.findMany({
      where: { status: 'LIVE', endsAt: { lte: now } },
      select: { id: true },
    });
    if (toEnded.length) {
      await this.prisma.auction.updateMany({
        where: { id: { in: toEnded.map((a) => a.id) } },
        data: { status: 'ENDED' },
      });
      toEnded.forEach((a) =>
        this.realtime.emitAuctionStatus?.({ auctionId: a.id, status: 'ENDED' }),
      );
    }
  }
}
