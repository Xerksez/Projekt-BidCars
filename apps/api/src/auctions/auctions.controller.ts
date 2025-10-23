import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiSecurity } from '@nestjs/swagger';

import { AuctionsService } from './auctions.service';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import { ListAuctionsDto } from './dto/list-auctions.dto';

// ⬇️ auth
import { ApiKeyGuard } from 'src/auth/api-key.guard';

@ApiTags('auctions')
@Controller('auctions')
export class AuctionsController {
  constructor(private readonly auctions: AuctionsService) {}

  // PUBLIC: lista z filtrami
  @Get()
  list(@Query() q: ListAuctionsDto) {
    return this.auctions.list(q);
  }

  // PUBLIC: detal
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.auctions.findOne(id);
  }

  // ADMIN ONLY: create
  @Post()
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('x-api-key')
  create(@Body() dto: CreateAuctionDto) {
    return this.auctions.create(dto);
  }

  // ADMIN ONLY: update
  @Patch(':id')
  @UseGuards(ApiKeyGuard)
 @ApiSecurity('x-api-key')
  update(@Param('id') id: string, @Body() dto: UpdateAuctionDto) {
    return this.auctions.update(id, dto);
  }

  // ADMIN ONLY: delete
  @Delete(':id')
  @UseGuards(ApiKeyGuard)
 @ApiSecurity('x-api-key')
  remove(@Param('id') id: string) {
    return this.auctions.remove(id);
  }
}
