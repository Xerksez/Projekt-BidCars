import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { AuctionsImportService } from './auctions-import.service';
import { VendorClient } from './vendor.client';

@Injectable()
export class ImportScheduler {
  private readonly log = new Logger(ImportScheduler.name);

  constructor(
    private readonly cfg: ConfigService,
    private readonly importer: AuctionsImportService,
    private readonly vendor: VendorClient,
  ) {}

  @Cron(CronExpression.EVERY_3_HOURS)
  async run() {
    if (this.cfg.get<string>('IMPORT_ENABLED') !== '1') return;

    const dryRun = this.cfg.get<string>('IMPORT_DRY_RUN') === '1';
    const mock = this.cfg.get<string>('IMPORT_USE_MOCK') === '1';
    const persist = this.cfg.get<string>('IMPORT_PERSIST') !== '0';
    const startPage = Number(this.cfg.get('IMPORT_START_PAGE') ?? 1);
    const perPage = Number(this.cfg.get('IMPORT_PER_PAGE') ?? 25);
    const maxPages = Number(this.cfg.get('IMPORT_MAX_PAGES') ?? 1);
    const source = this.cfg.get<string>('IMPORT_SOURCE') ?? 'VENDOR';

    this.vendor.resetCounter();
    this.log.log(`CRON start: dryRun=${dryRun}, mock=${mock}, persist=${persist}`);

    const res = await this.importer.runPagedActiveLots(
      {},
      { dryRun, mock, persist, source },
      { startPage, perPage, maxPages },
    );

    this.log.log(
      `CRON done: fetched=${res.totalFetched}, saved=${res.totalSaved}, pages=${res.pages.length}`,
    );
  }
}
