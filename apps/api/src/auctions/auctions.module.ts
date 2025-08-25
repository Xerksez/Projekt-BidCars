// apps/api/src/auctions/auctions.module.ts
import { Module } from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { AuctionsController } from './auctions.controller';

@Module({
  controllers: [AuctionsController],
  providers: [AuctionsService],
})
export class AuctionsModule {}
