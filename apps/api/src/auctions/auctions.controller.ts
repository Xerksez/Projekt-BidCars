import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
} from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import { ApiTags, ApiSecurity  } from '@nestjs/swagger';
import { BidsService } from '../bids/bids.service';
import { Query } from '@nestjs/common';
import { ListAuctionsDto } from './dto/list-auctions.dto';
import { AdminOnly } from '../auth/api-key.decorator';
import { } from '@nestjs/swagger';

@ApiTags('auctions')
@Controller('auctions')
export class AuctionsController {
  constructor(
    private readonly auctions: AuctionsService,
    private readonly bids: BidsService,
  ) {}

  @Get()
  findAll(@Query() q: ListAuctionsDto) {
  return this.auctions.list(q);
}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.auctions.findOne(id);
  }
  
  @AdminOnly()
  @ApiSecurity('apiKey')
  @Post()
  create(@Body() body: CreateAuctionDto) {
    return this.auctions.create(body);
  }

  @AdminOnly()
  @ApiSecurity('apiKey')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateAuctionDto) {
    return this.auctions.update(id, body);
  }

  @AdminOnly()
  @ApiSecurity('apiKey')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.auctions.remove(id);
  }

  @Get(':id/bids')
  findBids(@Param('id') id: string) {
    return this.bids.listForAuction(id);
  }
}
