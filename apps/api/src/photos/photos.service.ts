// apps/api/src/photos/photos.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class PhotosService {
  constructor(private readonly prisma: PrismaService) {}

  list(auctionId: string) {
    return this.prisma.auctionPhoto.findMany({
      where: { auctionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const p = await this.prisma.auctionPhoto.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Photo not found');
    return p;
  }

  create(auctionId: string, url: string) {
    return this.prisma.auctionPhoto.create({ data: { auctionId, url } });
  }

  async remove(id: string) {
    await this.prisma.auctionPhoto.delete({ where: { id } }).catch(() => {
      throw new NotFoundException('Photo not found');
    });
    return { ok: true };
  }
}
