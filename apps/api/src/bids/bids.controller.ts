import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BidsService } from './bids.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';

// ⬇️ ROZDZIEL: wartość (dekorator) vs typ
import { CurrentUser } from '../common/decorators/current-user';
import type { JwtUser } from '../common/decorators/current-user';


@ApiTags('bids')
@Controller('bids')
export class BidsController {
  constructor(private readonly bids: BidsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Body() body: CreateBidDto, @CurrentUser() user: JwtUser) {
    // user pochodzi z JWT; serwis dostaje jawnie userId
    return this.bids.create({ ...body, userId: user.sub });
  }

  @Get('auction/:auctionId')
  listForAuction(@Param('auctionId') auctionId: string) {
    return this.bids.listForAuction(auctionId);
  }
}
