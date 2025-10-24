import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiConsumes,
  ApiBody,
  ApiSecurity,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Express } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { PhotosService } from './photos.service';
import { ensureUploadDir, UPLOAD_DIR, PUBLIC_BASE, ROOT_DIR } from '../paths';
import { AdminOrApiKeyGuard } from '../auth/admin-or-api-key.guard';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

@ApiTags('photos')
@Controller('photos')
export class PhotosController {
  constructor(private readonly photos: PhotosService) {}

  @Get('auction/:auctionId')
  list(@Param('auctionId') auctionId: string) {
    return this.photos.list(auctionId);
  }

  // --- UPLOAD wariant 1: param w URL (/photos/auction/:auctionId) ---
  @UseGuards(AdminOrApiKeyGuard)
  @ApiBearerAuth('bearer') // JWT
  @ApiSecurity('x-api-key') // API key
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
          const name = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}${ext}`;
          cb(null, name);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const ok = /image\/(jpeg|png|webp|gif|bmp|svg\+xml)/.test(
          file.mimetype,
        );
        if (!ok) return cb(new Error('Only image files are allowed'), false);
        cb(null, true);
      },
      limits: { fileSize: MAX_SIZE },
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
  async uploadParam(
    @Param('auctionId') auctionId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: MAX_SIZE })],
      }),
    )
    file: Express.Multer.File,
  ) {
    const url = `${PUBLIC_BASE}/uploads/${file.filename}`;
    return this.photos.create(auctionId, url);
  }

  // --- UPLOAD wariant 2: param w body (/photos/upload) — pasuje do Twojego PhotoUploader ---
  @UseGuards(AdminOrApiKeyGuard)
  @ApiBearerAuth('bearer')
  @ApiSecurity('x-api-key')
  @Post('upload')
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
          const name = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}${ext}`;
          cb(null, name);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const ok = /image\/(jpeg|png|webp|gif|bmp|svg\+xml)/.test(
          file.mimetype,
        );
        if (!ok) return cb(new Error('Only image files are allowed'), false);
        cb(null, true);
      },
      limits: { fileSize: MAX_SIZE },
    }),
  )
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        auctionId: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['auctionId', 'file'],
    },
  })
  async uploadBody(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: MAX_SIZE })],
      }),
    )
    file: Express.Multer.File,
    @Body() body: { auctionId?: string },
  ) {
    if (!body?.auctionId) {
      throw new BadRequestException('auctionId is required');
    }
    const url = `${PUBLIC_BASE}/uploads/${file.filename}`;
    return this.photos.create(body.auctionId, url);
  }

  // DELETE (x-api-key lub JWT/ADMIN)
  @UseGuards(AdminOrApiKeyGuard)
  @ApiBearerAuth('bearer')
  @ApiSecurity('x-api-key')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.photos.remove(id);
  }

  @Get('_debug')
  debug() {
    const files = fs.existsSync(UPLOAD_DIR) ? fs.readdirSync(UPLOAD_DIR) : [];
    return { ROOT_DIR, UPLOAD_DIR, files };
  }
}
