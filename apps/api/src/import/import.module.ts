import { Module } from '@nestjs/common';
import { ImportController } from './import.controller';
import { AuctionsImportService } from './auctions-import.service';
import { PhotosModule } from '../photos/photos.module';

@Module({
  imports: [PhotosModule],
  controllers: [ImportController],
  providers: [AuctionsImportService],
})
export class ImportModule {}
