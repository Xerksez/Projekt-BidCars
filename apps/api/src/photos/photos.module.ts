import { Module, forwardRef } from '@nestjs/common';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photos.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AdminOrApiKeyGuard } from '../auth/admin-or-api-key.guard';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  controllers: [PhotosController],
  providers: [PhotosService, AdminOrApiKeyGuard],
  exports: [PhotosService],
})
export class PhotosModule {}
