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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuctionsService } from './auctions.service';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import { ListAuctionsDto } from './dto/list-auctions.dto';

// ⬇️ auth
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  create(@Body() dto: CreateAuctionDto) {
    return this.auctions.create(dto);
  }

  // ADMIN ONLY: update
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateAuctionDto) {
    return this.auctions.update(id, dto);
  }

  // ADMIN ONLY: delete
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.auctions.remove(id);
  }
}
