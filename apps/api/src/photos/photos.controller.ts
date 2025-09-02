// apps/api/src/photos/photos.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { ApiConsumes, ApiBody, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Express } from 'express';
import * as path from 'path';
import * as fs from 'fs';

import { PhotosService } from './photos.service';
import { AdminOnly } from '../auth/api-key.decorator';

// JEDNO źródło prawdy na uploady – to samo, z którego serwujesz statyki w main.ts
// (przykład: process.cwd() + '/uploads')
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const PUBLIC_BASE = process.env.API_PUBLIC_URL ?? 'http://localhost:3001';

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

@ApiTags('photos')
@Controller('photos')
export class PhotosController {
  constructor(private readonly photos: PhotosService) {}

  @Get('auction/:auctionId')
  list(@Param('auctionId') auctionId: string) {
    return this.photos.list(auctionId);
  }

  @AdminOnly()
  @ApiSecurity('apiKey')
  @Post('auction/:auctionId')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          ensureUploadDir();
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname) || '.jpg';
          const name = `${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 10)}${ext}`;
          cb(null, name);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const ok =
          file.mimetype.startsWith('image/') ||
          /\.(png|jpe?g|webp|gif|bmp|tiff?)$/i.test(file.originalname);
        // MUSI być 2-argumentowe wywołanie: (error, accept)
        if (!ok) return cb(new Error('Only image files are allowed'), false);
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  async upload(
    @Param('auctionId') auctionId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
  ) {
    const url = `${PUBLIC_BASE}/uploads/${file.filename}`; // absolutny URL, pewny
    return this.photos.create(auctionId, url);
  }

  @AdminOnly()
  @ApiSecurity('apiKey')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.photos.remove(id);
  }
}
