import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { AuctionsImportService } from './auctions-import.service';

@Injectable()
export class ImportScheduler {
  private readonly logger = new Logger(ImportScheduler.name);

  constructor(
    private readonly cfg: ConfigService,
    private readonly svc: AuctionsImportService,
  ) {}

  // domyślnie co 15 minut (możesz zmienić przez ENV)
  @Cron(CronExpression.EVERY_5_MINUTES)
  async run() {
    const enabled = this.cfg.get<string>('IMPORT_ENABLED') === '1';
    if (!enabled) return;

    const dryRun = this.cfg.get<string>('IMPORT_DRY_RUN') === '1';
    const mock = this.cfg.get<string>('IMPORT_USE_MOCK') === '1';
    const persist = this.cfg.get<string>('IMPORT_PERSIST') !== '0'; // domyślnie true

    const startPage = Number(this.cfg.get<string>('IMPORT_START_PAGE') ?? '1');
    const perPage = Number(this.cfg.get<string>('IMPORT_PER_PAGE') ?? '50');
    const maxPages = Number(this.cfg.get<string>('IMPORT_MAX_PAGES') ?? '2');

    this.logger.log(`Import cron started (dryRun=${dryRun}, mock=${mock}, persist=${persist})`);

    const res = await this.svc.runPagedActiveLots(
      { }, // tu możesz wstrzyknąć filtry, np. { auction_name: 'COPART' }
      { dryRun, mock, persist, source: this.cfg.get<string>('VENDOR_SOURCE') ?? 'VENDOR' },
      { startPage, perPage, maxPages },
    );

    this.logger.log(
      `Import cron done: fetched=${res.totalFetched}, saved=${res.totalSaved}, pages=${res.pages.length}`,
    );
  }
}
