// apps/api/src/vendor/vendor.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VendorService } from './vendor.service';
import type { VendorListParams } from './vendor.service';

@ApiTags('vendor')
@Controller('vendor')
export class VendorController {
  constructor(private readonly vendor: VendorService) {}

  /** Lista aukcji od vendora (paginacja/filtry opcjonalne) */
  @Get('auctions')
  list(@Query() query: VendorListParams) {
    return this.vendor.listAuctions(query);
  }

  /** Szczegóły aukcji */
  @Get('auctions/:id')
  getAuction(@Param('id') id: string) {
    return this.vendor.getAuction(id);
  }

  /** Zdjęcia aukcji */
  @Get('auctions/:id/photos')
  getPhotos(@Param('id') id: string) {
    return this.vendor.getAuctionPhotos(id);
  }
}
