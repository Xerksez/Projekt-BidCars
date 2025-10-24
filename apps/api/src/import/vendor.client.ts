import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export type Query = Record<string, unknown>;

@Injectable()
export class VendorClient {
  constructor(private readonly http: HttpService) {}

  private base = process.env.VENDOR_API_BASE || 'https://copart-iaai-api.com/api';
  private token = process.env.VENDOR_API_TOKEN || '';

  /** Skleja URL z parametrami (token w query, jak w docs). */
  private buildUrl(path: string, query: Query = {}) {
    const url = new URL(path, this.base);
    url.searchParams.set('api_token', this.token);

    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;

      // Obsługa tablic (np. auction_names[])
      if (Array.isArray(v)) {
        for (const val of v) {
          // TS-safe: wszystko zamieniamy na string
          url.searchParams.append(k, String(val));
        }
        continue;
      }

      // Pojedyncza wartość
      url.searchParams.set(k, String(v));
    }
    return url.toString();
  }

  /** Dry run: nie wywołuje HTTP, zwraca plan. */
  plan(path: string, query: Query = {}) {
    return { url: this.buildUrl(path, query), method: 'POST' as const, query };
  }

  /** Real call: POST bez body (API z docs używa tylko query). */
  async post(path: string, query: Query = {}) {
    const url = this.buildUrl(path, query);
    const res$ = this.http.post(url);
    const res = await firstValueFrom(res$);
    return res.data;
  }

  // Endpoints:
  getCarByVin(vin: string, onlyWithColor?: number) {
    return this.post('/api/v1/get-car-vin', { vin_number: vin, only_with_color: onlyWithColor });
  }
  listBuyNowCars(q: Query) {
    return this.post('/api/v1/buy-now-cars', q);
  }
  getCarByLot(lot_number: string | number, onlyWithColor?: number) {
    return this.post('/api/v1/get-car-lot', { lot_number, only_with_color: onlyWithColor });
  }
  vinDecoding(vin: string) {
    return this.post('/api/v2/vin-decoding', { vin });
  }
  listActiveLots(q: Query) {
    return this.post('/api/v2/get-active-lots', q);
  }
  listCarsV2(q: Query) {
    return this.post('/api/v2/get-cars', q);
  }

  // Dry-run warianty:
  planGetCarByVin(vin: string, onlyWithColor?: number) {
    return this.plan('/api/v1/get-car-vin', { vin_number: vin, only_with_color: onlyWithColor });
  }
  planActiveLots(q: Query) {
    return this.plan('/api/v2/get-active-lots', q);
  }
  planBuyNow(q: Query) {
    return this.plan('/api/v1/buy-now-cars', q);
  }
  planVinDecoding(vin: string) {
    return this.plan('/api/v2/vin-decoding', { vin });
  }
}
