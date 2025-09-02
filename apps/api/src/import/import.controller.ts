// apps/api/src/import/import.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuctionsImportService, VendorAuction } from './auctions-import.service';
import type { VendorSyncDto } from './dto/vendor-sync.dto';

@ApiTags('import')
@Controller('import')
export class ImportController {
  constructor(private readonly svc: AuctionsImportService) {}

  @Post('sync-one')
  syncOne(@Body() dto: VendorSyncDto & { auction: VendorAuction }) {
    return this.svc.syncOne(dto.source, dto.auction);
  }

  @Post('sync-batch')
  syncBatch(@Body() dto: VendorSyncDto & { auctions: VendorAuction[] }) {
    return this.svc.syncVendor(dto.source, dto.auctions);
  }
}
