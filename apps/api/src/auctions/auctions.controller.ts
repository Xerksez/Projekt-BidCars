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
import { ApiTags } from '@nestjs/swagger';

@ApiTags('auctions')
@Controller('auctions')
export class AuctionsController {
  constructor(private readonly auctions: AuctionsService) {}

  @Get()
  findAll() {
    return this.auctions.list();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.auctions.findOne(id);
  }

  @Post()
  create(@Body() body: CreateAuctionDto) {
    return this.auctions.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateAuctionDto) {
    return this.auctions.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.auctions.remove(id);
  }
}
