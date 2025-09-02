import { Module, forwardRef } from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { AuctionsController } from './auctions.controller';
import { BidsModule } from '../bids/bids.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { AuctionsStatusService } from './auctions-status.service';

@Module({
  imports: [
    forwardRef(() => BidsModule), 
    RealtimeModule,               
  ],
  providers: [AuctionsService, AuctionsStatusService],
  controllers: [AuctionsController],
  exports: [AuctionsService],
})
export class AuctionsModule {}
