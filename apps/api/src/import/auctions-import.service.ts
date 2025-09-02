// apps/api/src/import/auctions-import.service.ts
import { Injectable } from '@nestjs/common';
import { Prisma, AuctionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type VendorAuction = {
  externalId: string;
  title: string;
  vin?: string | null;
  startsAt: string | Date;
  endsAt: string | Date;
  images?: string[];
  currentPrice?: number;
  softCloseSec?: number;
  status?: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
  // cokolwiek dodatkowego:
  [k: string]: unknown;
};

@Injectable()
export class AuctionsImportService {
  constructor(private readonly prisma: PrismaService) {}

  async syncOne(source: string, data: VendorAuction) {
    const startsAt = new Date(data.startsAt);
    const endsAt = new Date(data.endsAt);
    const status: AuctionStatus =
      (data.status as AuctionStatus) ?? 'SCHEDULED';

    // Szukamy po (source, sourceId) bez composite unique (działa w każdej bazie)
    const existing = await this.prisma.auction.findFirst({
      where: { source, sourceId: data.externalId },
    });

    if (existing) {
      const updated = await this.prisma.auction.update({
        where: { id: existing.id },
        data: {
          title: data.title,
          vin: data.vin ?? null,
          startsAt,
          endsAt,
          currentPrice: data.currentPrice ?? existing.currentPrice,
          softCloseSec: data.softCloseSec ?? existing.softCloseSec,
          status,
          raw: (data as unknown) as Prisma.JsonObject,
        },
      });

      if (Array.isArray(data.images) && data.images.length) {
        await this.replacePhotos(updated.id, data.images);
      }
      return updated;
    }

    const created = await this.prisma.auction.create({
      data: {
        title: data.title,
        vin: data.vin ?? null,
        startsAt,
        endsAt,
        currentPrice: data.currentPrice ?? 0,
        softCloseSec: data.softCloseSec ?? 120,
        status,
        source,
        sourceId: data.externalId,
        raw: (data as unknown) as Prisma.JsonObject,
      },
    });

    if (Array.isArray(data.images) && data.images.length) {
      await this.replacePhotos(created.id, data.images);
    }
    return created;
  }

  private async replacePhotos(auctionId: string, urls: string[]) {
    await this.prisma.auctionPhoto.deleteMany({ where: { auctionId } });
    if (!urls.length) return;
    await this.prisma.auctionPhoto.createMany({
      data: urls.map((url, i) => ({ auctionId, url, sort: i })),
    });
  }

  async syncVendor(source: string, items: VendorAuction[]) {
    const results: { id: string }[] = [];
    for (const item of items) {
      const a = await this.syncOne(source, item);
      results.push({ id: a.id });
    }
    return { count: results.length, items: results };
  }
}
