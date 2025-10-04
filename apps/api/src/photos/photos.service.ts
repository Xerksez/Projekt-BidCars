// apps/api/src/photos/photos.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PUBLIC_BASE, UPLOAD_DIR } from 'src/paths';
import path from 'path';
import * as fs from 'fs';

@Injectable()
export class PhotosService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureLimit(auctionId: string, max = 30) {
    const count = await this.prisma.auctionPhoto.count({ where: { auctionId } });
    if (count >= max) {
      throw new BadRequestException(`Max ${max} photos per auction`);
    }
  }

  async create(auctionId: string, url: string) {
    await this.ensureLimit(auctionId);
    return this.prisma.auctionPhoto.create({ data: { auctionId, url } });
  }

  async list(auctionId: string) {
    return this.prisma.auctionPhoto.findMany({ where: { auctionId }, orderBy: { createdAt: 'desc' } });
  }

  async remove(id: string) {
    const photo = await this.prisma.auctionPhoto.findUnique({ where: { id } });
    if (!photo) throw new NotFoundException('Photo not found');

    // sprzątanie pliku na dysku (best-effort)
    try {
      const file = photo.url.replace(`${PUBLIC_BASE}/uploads/`, '');
      const abs = path.join(UPLOAD_DIR, file);
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
    } catch (e) {
      console.warn('[photos] unlink warn:', (e as Error).message);
    }

    await this.prisma.auctionPhoto.delete({ where: { id } });
    return { ok: true };
  }
    async findById(id: string) {
    const p = await this.prisma.auctionPhoto.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Photo not found');
    return p;
  }

}




