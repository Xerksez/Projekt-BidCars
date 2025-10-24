import { Body, Controller, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiQuery } from '@nestjs/swagger';
import { AuctionsImportService } from './auctions-import.service';
import { ApiKeyGuard } from '../auth/api-key.guard';

@ApiTags('import')
@Controller('import')
@UseGuards(ApiKeyGuard)
@ApiSecurity('x-api-key')
export class ImportController {
  constructor(private readonly svc: AuctionsImportService) {}

  @Post('active-lots')
  @ApiQuery({ name: 'dryRun', required: false, type: Boolean })
  @ApiQuery({ name: 'mock', required: false, type: Boolean })
  async activeLots(
    @Body() body: Record<string, unknown>,
    @Query('dryRun') dryRun?: string,
    @Query('mock') mock?: string,
  ) {
    const opts = {
      dryRun: dryRun === '1' || dryRun === 'true',
      persist: true,           // zmień na false jeśli chcesz realny fetch bez zapisu
      source: 'VENDOR',
      mock: mock === '1' || mock === 'true',
    };
    return this.svc.importActiveLots(body, opts);
  }

  @Post('vin')
  @ApiQuery({ name: 'vin', required: true })
  @ApiQuery({ name: 'dryRun', required: false, type: Boolean })
  @ApiQuery({ name: 'mock', required: false, type: Boolean })
  async vin(@Query('vin') vin: string, @Query('dryRun') dryRun?: string, @Query('mock') mock?: string) {
    const opts = {
      dryRun: dryRun === '1' || dryRun === 'true',
      persist: false,
      source: 'VENDOR',
      mock: mock === '1' || mock === 'true',
    };
    return this.svc.importVin(vin, opts);
  }
}
