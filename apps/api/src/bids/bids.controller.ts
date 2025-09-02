import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BidsService } from './bids.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('bids')
@Controller('bids')
export class BidsController {
  constructor(private readonly bids: BidsService) {}

  @Post()
  create(@Body() body: CreateBidDto) {
    return this.bids.create(body);
  }

  @Get('auction/:auctionId')
  listForAuction(@Param('auctionId') auctionId: string) {
    return this.bids.listForAuction(auctionId);
  }
}
