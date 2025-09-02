import { Module } from '@nestjs/common';
import { BidsService } from './bids.service';
import { BidsController } from './bids.controller';

import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  
  imports: [RealtimeModule],   
  providers: [BidsService],
  controllers: [BidsController],
  exports: [BidsService],               
})
export class BidsModule {}
