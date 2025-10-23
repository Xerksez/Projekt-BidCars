import { Module, forwardRef } from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { AuctionsController } from './auctions.controller';
import { BidsModule } from '../bids/bids.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { AuctionsStatusService } from './auctions-status.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [forwardRef(() => BidsModule), RealtimeModule, AuthModule],
  providers: [AuctionsService, AuctionsStatusService],
  controllers: [AuctionsController],
  exports: [AuctionsService],
})
export class AuctionsModule {}
