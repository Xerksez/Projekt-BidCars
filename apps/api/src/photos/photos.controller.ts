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
import { ensureUploadDir, UPLOAD_DIR, PUBLIC_BASE, ROOT_DIR } from '../paths';

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
        destination: (req, file, cb) => {
          ensureUploadDir();
          cb(null, UPLOAD_DIR);
        },
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname) || '.jpg';
          const name = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}${ext}`;
          cb(null, name);
        },
      }),
      fileFilter: (req, file, cb) => {
        // prosta walidacja typu
        const ok = /image\/(jpeg|png|webp|gif|bmp|svg\+xml)/.test(
          file.mimetype,
        );
        if (!ok) return cb(new Error('Only image files are allowed'), false);
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
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
    const url = `${PUBLIC_BASE}/uploads/${file.filename}`; // ABS URL do pliku w root/uploads
    return this.photos.create(auctionId, url);
  }

  @AdminOnly()
  @ApiSecurity('apiKey')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.photos.remove(id);
  }

  @Get('_debug')
  debug() {
    const files = fs.existsSync(UPLOAD_DIR) ? fs.readdirSync(UPLOAD_DIR) : [];
    return {
      ROOT_DIR,
      UPLOAD_DIR,
      files,
    };
  }
}
