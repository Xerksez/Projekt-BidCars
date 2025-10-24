import { Body, Controller, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiQuery } from '@nestjs/swagger';
import { AuctionsImportService } from './auctions-import.service';
import { ConfigService } from '@nestjs/config';
import { ApiKeyGuard } from '../auth/api-key.guard';

@ApiTags('import')
@Controller('import')
@UseGuards(ApiKeyGuard)
@ApiSecurity('x-api-key')
export class ImportController {
  constructor(
    private readonly svc: AuctionsImportService,
    private readonly cfg: ConfigService,
  ) {}

  @Post('active-lots/run')
  @ApiQuery({ name: 'dryRun', required: false, type: Boolean })
  @ApiQuery({ name: 'mock', required: false, type: Boolean })
  @ApiQuery({ name: 'persist', required: false, type: Boolean })
  @ApiQuery({ name: 'startPage', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiQuery({ name: 'maxPages', required: false, type: Number })
  async runActiveLots(
    @Body() body: Record<string, unknown>,
    @Query('dryRun') dryRun?: string,
    @Query('mock') mock?: string,
    @Query('persist') persist?: string,
    @Query('startPage') startPage?: string,
    @Query('perPage') perPage?: string,
    @Query('maxPages') maxPages?: string,
  ) {
    const toBool = (v?: string, env?: string) =>
      v === '1' || v === 'true' || env === '1';

    return this.svc.runPagedActiveLots(
      body ?? {},
      {
        dryRun: toBool(dryRun, this.cfg.get('IMPORT_DRY_RUN')),
        mock: toBool(mock, this.cfg.get('IMPORT_USE_MOCK')),
        persist: toBool(persist, this.cfg.get('IMPORT_PERSIST')),
        source: this.cfg.get('IMPORT_SOURCE') ?? 'VENDOR',
      },
      {
        startPage: Number(startPage ?? this.cfg.get('IMPORT_START_PAGE') ?? 1),
        perPage: Number(perPage ?? this.cfg.get('IMPORT_PER_PAGE') ?? 25),
        maxPages: Number(maxPages ?? this.cfg.get('IMPORT_MAX_PAGES') ?? 1),
      },
    );
  }

  @Post('vin')
  @ApiQuery({ name: 'vin', required: true })
  async vin(@Query('vin') vin: string, @Query('dryRun') dryRun?: string) {
    const opts = {
      dryRun: dryRun === '1' || dryRun === 'true',
      mock: this.cfg.get('IMPORT_USE_MOCK') === '1',
      persist: false,
      source: this.cfg.get('IMPORT_SOURCE') ?? 'VENDOR',
    };
    return this.svc.importVin(vin, opts);
  }
}
