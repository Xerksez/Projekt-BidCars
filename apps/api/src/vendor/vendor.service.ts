// apps/api/src/vendor/vendor.service.ts
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

const VENDOR_BASE_URL = process.env.VENDOR_BASE_URL ?? 'https://example.vendor/api';
const VENDOR_API_KEY  = process.env.VENDOR_API_KEY  ?? '';

/** Minimalne typy pod wstępną integrację (dopasujemy później do prawdziwego API) */
export type VendorStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';

export interface VendorAuctionSummary {
  id: string;
  title: string;
  vin?: string | null;
  startsAt?: string; // ISO
  endsAt?: string;   // ISO
  status?: VendorStatus;
  currentPrice?: number;
  // cokolwiek jeszcze przyjdzie...
}

export interface VendorAuctionDetail extends VendorAuctionSummary {
  description?: string;
  // …
}

export interface VendorPhoto {
  url: string; // absolutny URL zdjęcia
}

/** Opcjonalne parametry listy (placeholder) */
export interface VendorListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: VendorStatus;
}

@Injectable()
export class VendorService {
  constructor(private readonly http: HttpService) {}

  /** Wspólne nagłówki */
  private headers() {
    return VENDOR_API_KEY
      ? { 'Authorization': `Bearer ${VENDOR_API_KEY}` }
      : {};
  }

  /** Lista aukcji od vendora */
  async listAuctions(params: VendorListParams = {}): Promise<VendorAuctionSummary[]> {
    const { page = 1, limit = 20, search, status } = params;

    const { data } = await firstValueFrom(
      this.http.get<VendorAuctionSummary[]>(`${VENDOR_BASE_URL}/auctions`, {
        headers: this.headers(),
        params: { page, limit, search, status },
      }),
    );

    return data;
  }

  /** Szczegóły aukcji */
  async getAuction(auctionId: string): Promise<VendorAuctionDetail> {
    const { data } = await firstValueFrom(
      this.http.get<VendorAuctionDetail>(`${VENDOR_BASE_URL}/auctions/${auctionId}`, {
        headers: this.headers(),
      }),
    );

    return data;
  }

  /** Zdjęcia aukcji */
  async getAuctionPhotos(auctionId: string): Promise<VendorPhoto[]> {
    const { data } = await firstValueFrom(
      this.http.get<VendorPhoto[]>(`${VENDOR_BASE_URL}/auctions/${auctionId}/photos`, {
        headers: this.headers(),
      }),
    );

    return data;
  }

  /**
   * Przykładowy fetch dowolnego zasobu vendora (do rozbudowy później)
   * Dzięki typom generycznym nie używamy `any`.
   */
  async fetchGeneric<T>(path: string, query?: Record<string, string | number | boolean>): Promise<T> {
    const { data } = await firstValueFrom(
      this.http.get<T>(`${VENDOR_BASE_URL}${path}`, {
        headers: this.headers(),
        params: query,
      }),
    );
    return data;
  }
}
