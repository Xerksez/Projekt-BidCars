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

// ——— Vendor shapes (typujemy to, co realnie używamy) ———
type VendorActiveBid = {
  id?: number;
  auction?: number;
  sale_date?: string | number; // bywa string "1759..." albo number
  all_lots_id?: number;
  bid_updated?: number;
  current_bid?: number;
  date_updated?: number;
};

type VendorCurrency = {
  id?: number;
  name?: string;
  code_id?: number;
  iso_code?: number;
  char_code?: string; // ← bierzemy to na currencyCode
};

type VendorCarPhoto = {
  id?: number | null;
  photo?: string[];
  all_lots_id?: number;
};

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
  car_photo?: VendorCarPhoto;

  sale_date?: string;
  url?: string;
  source_url?: string;
  startsAt?: string;
  endsAt?: string;
  auction_date_from?: string;
  auction_date_to?: string;

  fuel?: string;
  color?: string;
  drive?: string;
  series?: string | null;
  engine_type?: string;
  transmission?: string;
  cylinders?: string | number;
  body_style?: string;
  vehicle_type?: string;
  odometer?: number;
  car_keys?: string | 'yes' | 'no';

  location?: string;
  auction_name?: string;

  highlights?: string | null;
  primary_damage?: string;
  secondary_damage?: string;

  est_retail_value?: number;
  currency?: VendorCurrency;

  active_bidding?: VendorActiveBid[];

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
        const from = (page - 1) * per_page;
        const to = from + per_page;
        const pageSlice = (mockItems ?? []).slice(from, to);

        if (dryRun) {
          perPageResults.push({ page, count: pageSlice.length, saved: 0 });
        } else {
          const res = await this.importActiveLots(q, {
            ...opts,
            dryRun: false,
            mock: true,
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
        if (pageSlice.length < per_page) break;
        continue;
      }

      // REAL: jedziemy stronami
      if (dryRun) {
        perPageResults.push({ page, count: 0, saved: 0 });
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
          if (res.count < per_page) break;
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
      resolve(__dirname, 'mocks', filename),
      resolve(process.cwd(), 'apps', 'api', 'src', 'import', 'mocks', filename),
      resolve(process.cwd(), 'src', 'import', 'mocks', filename),
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
        vendorRawPreview?: string;
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

      // ——— Vehicle upsert ———
      let vehicleId: string | undefined = undefined;
      if (mapped.vin) {
        const cylindersNum =
          typeof raw?.cylinders === 'number'
            ? raw.cylinders
            : typeof raw?.cylinders === 'string'
              ? Number(raw.cylinders) || undefined
              : undefined;

        const keysPresent =
          typeof raw?.car_keys === 'string'
            ? raw.car_keys.toLowerCase() === 'yes'
            : undefined;

        const vehicle = await this.prisma.vehicle.upsert({
          where: { vin: mapped.vin },
          update: {
            make: mapped.make ?? undefined,
            model: mapped.model ?? undefined,
            year: typeof mapped.year === 'number' ? mapped.year : undefined,
            bodyStyle:
              typeof raw?.body_style === 'string' ? raw.body_style : undefined,
            fuel: typeof raw?.fuel === 'string' ? raw.fuel : undefined,
            engineType:
              typeof raw?.engine_type === 'string'
                ? raw.engine_type
                : undefined,
            cylinders: cylindersNum,
            drive: typeof raw?.drive === 'string' ? raw.drive : undefined,
            transmission:
              typeof raw?.transmission === 'string'
                ? raw.transmission
                : undefined,
            color: typeof raw?.color === 'string' ? raw.color : undefined,
            vehicleType:
              typeof raw?.vehicle_type === 'string'
                ? raw.vehicle_type
                : undefined,
            series: typeof raw?.series === 'string' ? raw.series : undefined,
            odometer:
              typeof raw?.odometer === 'number' ? raw.odometer : undefined,
            keysPresent: keysPresent,
          },
          create: {
            vin: mapped.vin,
            make: mapped.make ?? undefined,
            model: mapped.model ?? undefined,
            year: typeof mapped.year === 'number' ? mapped.year : undefined,
            bodyStyle:
              typeof raw?.body_style === 'string' ? raw.body_style : undefined,
            fuel: typeof raw?.fuel === 'string' ? raw.fuel : undefined,
            engineType:
              typeof raw?.engine_type === 'string'
                ? raw.engine_type
                : undefined,
            cylinders: cylindersNum,
            drive: typeof raw?.drive === 'string' ? raw.drive : undefined,
            transmission:
              typeof raw?.transmission === 'string'
                ? raw.transmission
                : undefined,
            color: typeof raw?.color === 'string' ? raw.color : undefined,
            vehicleType:
              typeof raw?.vehicle_type === 'string'
                ? raw.vehicle_type
                : undefined,
            series: typeof raw?.series === 'string' ? raw.series : undefined,
            odometer:
              typeof raw?.odometer === 'number' ? raw.odometer : undefined,
            keysPresent: keysPresent,
          },
        });
        vehicleId = vehicle.id;
      }

      // ——— Auction attributes z vendora ———
      const auctionHouse =
        typeof raw?.auction_name === 'string' ? raw.auction_name : null;
      const location = typeof raw?.location === 'string' ? raw.location : null;

      const lotNumber =
        typeof raw?.lot_number === 'number'
          ? raw.lot_number
          : typeof raw?.lot_number === 'string'
            ? Number(raw.lot_number) || null
            : null;

      const estRetailValue =
        typeof raw?.est_retail_value === 'number' ? raw.est_retail_value : null;

      const primaryDamage =
        typeof raw?.primary_damage === 'string' ? raw.primary_damage : null;

      const secondaryDamage =
        typeof raw?.secondary_damage === 'string' ? raw.secondary_damage : null;

      const currencyCode =
        typeof raw?.currency?.char_code === 'string'
          ? raw.currency.char_code
          : null;

      const vendorCurrentBid =
        Array.isArray(raw?.active_bidding) && raw.active_bidding.length
          ? Number(raw.active_bidding[0]?.current_bid ?? 0) || 0
          : typeof raw?.current_bid === 'number'
            ? raw.current_bid
            : 0;

      const saleDateTs: bigint | null =
        Array.isArray(raw?.active_bidding) && raw.active_bidding.length
          ? raw.active_bidding[0]?.sale_date != null
            ? BigInt(String(raw.active_bidding[0]?.sale_date))
            : null
          : typeof raw?.sale_date === 'string'
            ? (BigInt(raw.sale_date) as bigint)
            : null;

      // ——— Photo list: vendor + mapped ———
      const vendorPhotos = Array.isArray(raw?.car_photo?.photo)
        ? (raw.car_photo.photo as string[])
        : [];

      const allPhotos = Array.from(
        new Set([...(mapped.photos ?? []), ...vendorPhotos]),
      );

      // ——— Auction upsert ———
      const up = await this.prisma.auction.upsert({
        where: { source_sourceId: { source, sourceId: mapped.sourceId ?? '' } },
        update: {
          title: mapped.title,
          vin: mapped.vin ?? null,
          vehicleId,
          startsAt: mapped.startsAt,
          endsAt: mapped.endsAt,
          currentPrice: mapped.currentPrice ?? 0,
          status: mapped.status as RTStatus,
          sourceUrl: mapped.sourceUrl ?? null,
          // nowe kolumny
          auctionHouse,
          location,
          lotNumber,
          estRetailValue,
          primaryDamage,
          secondaryDamage,
          currencyCode,
          vendorCurrentBid,
          saleDateTs,
          raw: raw as unknown as object,
        },
        create: {
          title: mapped.title,
          vin: mapped.vin ?? null,
          vehicleId,
          startsAt: mapped.startsAt,
          endsAt: mapped.endsAt,
          currentPrice: mapped.currentPrice ?? 0,
          status: mapped.status as RTStatus,
          source,
          sourceId: mapped.sourceId ?? null,
          sourceUrl: mapped.sourceUrl ?? null,
          // nowe kolumny
          auctionHouse,
          location,
          lotNumber,
          estRetailValue,
          primaryDamage,
          secondaryDamage,
          currencyCode,
          vendorCurrentBid,
          saleDateTs,
          raw: raw as unknown as object,
        },
      });

      // ——— photos upsert ———
      if (allPhotos.length) {
        for (let i = 0; i < allPhotos.length; i++) {
          const url = allPhotos[i];
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

      // ——— snapshoty active_bidding ———
      if (Array.isArray(raw?.active_bidding)) {
        for (const ab of raw.active_bidding) {
          await this.prisma.auctionActiveBid.create({
            data: {
              auctionId: up.id,
              saleDateTs:
                ab?.sale_date != null ? BigInt(String(ab.sale_date)) : null,
              currentBid:
                typeof ab?.current_bid === 'number' ? ab.current_bid : null,
              bidUpdated:
                typeof ab?.bid_updated === 'number' ? ab.bid_updated : null,
              dateUpdated:
                typeof ab?.date_updated === 'number' ? ab.date_updated : null,
            },
          });
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

  private extractItems(apiRes: unknown): VendorActiveLot[] {
    if (Array.isArray(apiRes)) return apiRes as VendorActiveLot[];

    const anyRes = apiRes as Record<string, unknown> | null;
    if (!anyRes || typeof anyRes !== 'object') return [];

    const tryPaths: Array<string[]> = [
      ['data'],
      ['data', 'data'],
      ['items'],
      ['result'],
      ['response', 'items'],
      ['payload', 'items'],
      ['cars'],
      ['lots'],
    ];

    for (const path of tryPaths) {
      let current: unknown = anyRes;
      for (const k of path) {
        if (
          current &&
          typeof current === 'object' &&
          k in (current as Record<string, unknown>)
        ) {
          current = (current as Record<string, unknown>)[k];
        } else {
          current = undefined;
          break;
        }
      }
      if (Array.isArray(current)) return current as VendorActiveLot[];
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
