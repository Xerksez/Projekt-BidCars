// apps/api/src/import/auctions-import.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VendorClient, Query } from './vendor.client';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { existsSync } from 'fs';

type RTStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';

type ImportOpts = {
  dryRun?: boolean;
  persist?: boolean; // domyślnie true
  source?: string; // np. 'VENDOR'
  mock?: boolean; // jeśli true -> czytamy plik JSON zamiast realnego API
};

type ActiveLotsQuery = Query;

type VendorActiveLot = {
  id?: string | number;
  lot_number?: string | number;
  make?: string;
  model?: string;
  year?: number | string;
  vin?: string;
  vin_number?: string;
  current_bid?: number;
  price?: number;
  photos?: string[];
  images?: string[];
  sale_date?: string;
  url?: string;
  source_url?: string;
  startsAt?: string;
  endsAt?: string;
  auction_date_from?: string;
  auction_date_to?: string;
  status?: RTStatus | string;
  title?: unknown;
  [key: string]: unknown;
};

type VendorListResponse =
  | { data?: VendorActiveLot[]; meta?: unknown }
  | VendorActiveLot[];

type MappedAuction = {
  title: string;
  vin?: string | null;
  startsAt: Date;
  endsAt: Date;
  currentPrice?: number;
  softCloseSec?: number;
  status: RTStatus;
  sourceId?: string | null;
  sourceUrl?: string | null;
  photos?: string[];
  make?: string | null;
  model?: string | null;
  year?: number | null;
};

type DryRunItem = {
  mapped: MappedAuction;
  rawSampleKey: string | number | null;
};
type PersistItem = { id: string; vin: string | null; sourceId: string | null };

@Injectable()
export class AuctionsImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vendor: VendorClient,
  ) {}

  async runPagedActiveLots(
    baseQuery: Record<string, unknown>,
    opts: {
      dryRun?: boolean;
      mock?: boolean;
      persist?: boolean;
      source?: string;
    } = {},
    paging: { startPage?: number; perPage?: number; maxPages?: number } = {},
  ) {
    const startPage = Math.max(1, paging.startPage ?? 1);
    const per_page = Math.max(1, paging.perPage ?? 50);
    const maxPages = Math.max(1, paging.maxPages ?? 5);

    // Gdy mock+dryRun: będziemy symulować strony lokalnie na bazie mocka
    const useMock = !!opts.mock;
    const dryRun = !!opts.dryRun;

    let totalFetched = 0;
    let totalSaved = 0;
    const perPageResults: Array<{
      page: number;
      count: number;
      saved: number;
    }> = [];

    // Przy mocku: wczytaj raz całość i "paginuj" lokalnie
    let mockItems: VendorActiveLot[] | null = null;
    if (useMock) {
      const mockUnknown = await this.loadMock('active-lots.sample.json');

      let arr: VendorActiveLot[] = [];
      if (Array.isArray(mockUnknown)) {
        // przypadek: plik to bezpośrednio tablica rekordów
        arr = mockUnknown as VendorActiveLot[];
      } else if (
        typeof mockUnknown === 'object' &&
        mockUnknown !== null &&
        'data' in mockUnknown
      ) {
        const data = (mockUnknown as { data?: unknown }).data;
        if (Array.isArray(data)) {
          arr = data as VendorActiveLot[];
        }
      }

      mockItems = arr;
    }

    for (let page = startPage; page < startPage + maxPages; page++) {
      const q = { ...baseQuery, page, per_page };

      if (useMock) {
        // lokalna paginacja mocka
        const from = (page - 1) * per_page;
        const to = from + per_page;
        const pageSlice = (mockItems ?? []).slice(from, to);

        if (dryRun) {
          // pokaż tylko statystyki — bez zapisu
          perPageResults.push({ page, count: pageSlice.length, saved: 0 });
        } else {
          // persist na bazie mocka
          const res = await this.importActiveLots(q, {
            ...opts,
            dryRun: false,
            mock: true,
            // persist bierze się z opts.persist (domyślnie true)
          });
          if (res.dryRun) {
            perPageResults.push({
              page,
              count: res.items?.length ?? 0,
              saved: 0,
            });
          } else {
            perPageResults.push({ page, count: res.count, saved: res.saved });
            totalSaved += res.saved;
          }
        }

        totalFetched += pageSlice.length;
        if (pageSlice.length < per_page) break; // koniec danych mocka
        continue;
      }

      // REAL: jedziemy stronami
      if (dryRun) {
        // nie wywołujemy vendora — tylko plan + 0 zapisów
        perPageResults.push({ page, count: 0, saved: 0 });
        // możesz tu ewentualnie logować plan.url
      } else {
        const res = await this.importActiveLots(q, {
          ...opts,
          dryRun: false,
          mock: false,
        });
        if (res.dryRun) {
          perPageResults.push({
            page,
            count: res.items?.length ?? 0,
            saved: 0,
          });
        } else {
          perPageResults.push({ page, count: res.count, saved: res.saved });
          totalFetched += res.count;
          totalSaved += res.saved;
          if (res.count < per_page) break; // ostatnia strona
        }
      }
    }

    return {
      dryRun,
      mock: useMock,
      startPage,
      per_page,
      maxPages,
      totalFetched,
      totalSaved,
      pages: perPageResults,
    };
  }

  /** Czytanie mocka, odporne na różne CWD i build (dist). */
  private async loadMock(filename: string): Promise<unknown> {
    const candidates = [
      // dev (ts-node) – __dirname zwykle .../src/import
      resolve(__dirname, 'mocks', filename),
      // monorepo – uruchamianie z root
      resolve(process.cwd(), 'apps', 'api', 'src', 'import', 'mocks', filename),
      // uruchamianie z apps/api jako CWD
      resolve(process.cwd(), 'src', 'import', 'mocks', filename),
      // prod build – dist
      resolve(process.cwd(), 'dist', 'import', 'mocks', filename),
    ];

    for (const p of candidates) {
      if (existsSync(p)) {
        const raw = await readFile(p, 'utf8');
        return JSON.parse(raw);
      }
    }
    throw new Error(
      `Mock file not found: ${filename}\nTried:\n${candidates.join('\n')}`,
    );
  }

  /**
   * Import (lub plan/mock) listy aktywnych aukcji
   */
  async importActiveLots(
    q: ActiveLotsQuery,
    opts: ImportOpts = {},
  ): Promise<
    | {
        dryRun: true;
        plan: { url: string; method: 'POST'; query: Record<string, unknown> };
        hint: string;
        items?: DryRunItem[];
      }
    | { dryRun: false; count: number; saved: number; items: PersistItem[] }
  > {
    const dryRun = !!opts.dryRun;
    const persist = opts.persist !== false;
    const source = opts.source ?? 'VENDOR';
    const useMock = !!opts.mock;

    if (dryRun) {
      const plan = this.vendor.planActiveLots(q);
      if (useMock) {
        const mock = (await this.loadMock(
          'active-lots.sample.json',
        )) as VendorListResponse;
        const items = this.extractItems(mock).slice(0, 5);
        const mappedItems: DryRunItem[] = items.map((raw) => ({
          mapped: this.mapVendorItemToAuction(raw),
          rawSampleKey: this.sampleKey(raw),
        }));
        return {
          dryRun: true,
          plan: { url: plan.url, method: plan.method, query: plan.query },
          hint: 'Mock data preview',
          items: mappedItems,
        };
      }
      return {
        dryRun: true,
        plan: { url: plan.url, method: plan.method, query: plan.query },
        hint: 'No external call done.',
      };
    }

    // realny call (lub mock)
    const apiRes = useMock
      ? ((await this.loadMock('active-lots.sample.json')) as VendorListResponse)
      : await this.vendor.listActiveLots(q);

    const items = this.extractItems(apiRes);

    if (!persist) {
      const plan = this.vendor.planActiveLots(q);
      const preview: DryRunItem[] = items.slice(0, 10).map((raw) => ({
        mapped: this.mapVendorItemToAuction(raw),
        rawSampleKey: this.sampleKey(raw),
      }));
      return {
        dryRun: true,
        plan: { url: plan.url, method: plan.method, query: plan.query },
        hint: 'Fetched (no persist)',
        items: preview,
      };
    }

    // zapis do DB (upsert Vehicle + link w Auction.vehicleId)
    let saved = 0;
    const results: PersistItem[] = [];

    for (const raw of items) {
      const mapped = this.mapVendorItemToAuction(raw);

      let vehicleId: string | undefined = undefined;
      if (mapped.vin) {
        const vehicle = await this.prisma.vehicle.upsert({
          where: { vin: mapped.vin },
          update: {
            make: mapped.make ?? undefined,
            model: mapped.model ?? undefined,
            year: typeof mapped.year === 'number' ? mapped.year : undefined,
          },
          create: {
            vin: mapped.vin,
            make: mapped.make ?? undefined,
            model: mapped.model ?? undefined,
            year: typeof mapped.year === 'number' ? mapped.year : undefined,
          },
        });
        vehicleId = vehicle.id;
      }

      const up = await this.prisma.auction.upsert({
        where: { source_sourceId: { source, sourceId: mapped.sourceId ?? '' } },
        update: {
          title: mapped.title,
          vin: mapped.vin ?? null,
          vehicleId, // ← powiązanie z pojazdem
          startsAt: mapped.startsAt,
          endsAt: mapped.endsAt,
          currentPrice: mapped.currentPrice ?? 0,
          softCloseSec: mapped.softCloseSec ?? 120,
          status: mapped.status as RTStatus,
          sourceUrl: mapped.sourceUrl ?? null,
          raw: raw as unknown as object,
        },
        create: {
          title: mapped.title,
          vin: mapped.vin ?? null,
          vehicleId, // ← powiązanie z pojazdem
          startsAt: mapped.startsAt,
          endsAt: mapped.endsAt,
          currentPrice: mapped.currentPrice ?? 0,
          softCloseSec: mapped.softCloseSec ?? 120,
          status: mapped.status as RTStatus,
          source,
          sourceId: mapped.sourceId ?? null,
          sourceUrl: mapped.sourceUrl ?? null,
          raw: raw as unknown as object,
        },
      });

      if (Array.isArray(mapped.photos) && mapped.photos.length) {
        for (let i = 0; i < mapped.photos.length; i++) {
          const url = mapped.photos[i];
          try {
            await this.prisma.auctionPhoto.upsert({
              where: { auctionId_url: { auctionId: up.id, url } },
              update: { sort: i },
              create: { auctionId: up.id, url, sort: i },
            });
          } catch {
            /* ignore single photo errors */
          }
        }
      }

      saved++;
      results.push({
        id: up.id,
        vin: up.vin ?? null,
        sourceId: up.sourceId ?? null,
      });
    }

    return { dryRun: false, count: items.length, saved, items: results };
  }

  /** VIN decoding – mock/dry-run */
  async importVin(vin: string, opts: ImportOpts = {}) {
    const dryRun = !!opts.dryRun;
    const useMock = !!opts.mock;
    if (dryRun) {
      const plan = this.vendor.planVinDecoding(vin);
      if (useMock) {
        const mock = await this.loadMock('vin-decoding.sample.json');
        return {
          dryRun: true,
          plan: { url: plan.url, method: plan.method, query: plan.query },
          mock,
        };
      }
      return {
        dryRun: true,
        plan: { url: plan.url, method: plan.method, query: plan.query },
      };
    }
    const data = await (useMock
      ? this.loadMock('vin-decoding.sample.json')
      : this.vendor.vinDecoding(vin));
    return { dryRun: false, vendor: data };
  }

  // ----------------- helpers -----------------

  private extractItems(apiRes: VendorListResponse): VendorActiveLot[] {
    if (Array.isArray(apiRes)) return apiRes as VendorActiveLot[];
    if (Array.isArray((apiRes as { data?: VendorActiveLot[] })?.data)) {
      return (apiRes as { data?: VendorActiveLot[] }).data as VendorActiveLot[];
    }
    return [];
  }

  private sampleKey(raw: VendorActiveLot): string | number | null {
    const key = raw?.id ?? raw?.lot_number;
    return typeof key === 'string' || typeof key === 'number' ? key : null;
  }

  /** mapowanie jednego elementu vendor → Auction (kanoniczny) */
  private mapVendorItemToAuction(raw: VendorActiveLot): MappedAuction {
    const joined = [raw?.make, raw?.model, raw?.year].filter(Boolean).join(' ');
    const title =
      typeof raw?.title === 'string'
        ? raw.title
        : joined.length > 0
          ? joined
          : 'Imported lot';

    const vin =
      (typeof raw?.vin === 'string' && raw.vin) ||
      (typeof raw?.vin_number === 'string' && raw.vin_number) ||
      null;

    const nowMs = Date.now();
    const startsAt = raw?.auction_date_from
      ? new Date(raw.auction_date_from)
      : raw?.startsAt
        ? new Date(raw.startsAt)
        : new Date(nowMs);

    const endsAt = raw?.auction_date_to
      ? new Date(raw.auction_date_to)
      : raw?.sale_date
        ? new Date(raw.sale_date)
        : raw?.endsAt
          ? new Date(raw.endsAt)
          : new Date(nowMs + 24 * 3600 * 1000);

    const currentPrice =
      typeof raw?.current_bid === 'number'
        ? raw.current_bid
        : typeof raw?.price === 'number'
          ? raw.price
          : 0;

    const status: RTStatus =
      (['SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED'].includes(String(raw?.status))
        ? (raw?.status as RTStatus)
        : undefined) ??
      (Date.now() < endsAt.getTime()
        ? Date.now() < startsAt.getTime()
          ? 'SCHEDULED'
          : 'LIVE'
        : 'ENDED');

    const idVal = raw?.id ?? raw?.lot_number ?? null;
    const sourceId = idVal != null ? String(idVal) : null;

    const sourceUrl =
      (typeof raw?.url === 'string' && raw.url) ||
      (typeof raw?.source_url === 'string' && raw.source_url) ||
      (sourceId ? `https://example-vendor/lot/${sourceId}` : null);

    const photos = Array.isArray(raw?.photos)
      ? (raw.photos as string[])
      : Array.isArray(raw?.images)
        ? (raw.images as string[])
        : [];

    const make = typeof raw?.make === 'string' ? raw.make : null;
    const model = typeof raw?.model === 'string' ? raw.model : null;
    const year =
      typeof raw?.year === 'number'
        ? raw.year
        : typeof raw?.year === 'string'
          ? Number(raw.year) || null
          : null;

    return {
      title,
      vin,
      startsAt,
      endsAt,
      currentPrice,
      softCloseSec: 120,
      status,
      sourceId,
      sourceUrl,
      photos,
      make,
      model,
      year,
    };
  }
}
