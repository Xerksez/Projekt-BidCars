import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type Query = Record<
  string,
  string | number | boolean | string[] | number[] | undefined
>;

export type VendorListResponse =
  | { data?: Record<string, unknown>[]; meta?: unknown }
  | Record<string, unknown>[];

@Injectable()
export class VendorClient {
  private readonly base: string;
  private readonly token: string;
  private readonly timeoutMs: number;
  private readonly dryRun: boolean;
  private readonly useMock: boolean;
  private readonly maxReqPerRun: number;
  private requests = 0;

  constructor(private readonly cfg: ConfigService) {
    this.base = this.cfg.get<string>('VENDOR_API_BASE', '');
    this.token = this.cfg.get<string>('VENDOR_API_TOKEN', '');
    this.timeoutMs = Number(this.cfg.get<string>('VENDOR_TIMEOUT_MS', '8000'));
    this.dryRun = this.cfg.get<string>('IMPORT_DRY_RUN', '0') === '1';
    this.useMock = this.cfg.get<string>('IMPORT_USE_MOCK', '0') === '1';
    this.maxReqPerRun = Number(
      this.cfg.get<string>('VENDOR_MAX_REQ_PER_RUN', '5'),
    );
  }

  /** Plan wywołania - nie robi requesta */
  planActiveLots(query: Query) {
    return {
      url: `${this.base}/api/v2/get-active-lots`,
      method: 'POST' as const,
      query: { api_token: this.redactedToken(), ...query },
    };
  }

  /** Realne wywołanie do vendora */
  async listActiveLots(query: Query): Promise<VendorListResponse> {
    return this.post<VendorListResponse>('/api/v2/get-active-lots', query);
  }

  /** VIN decode */
  planVinDecoding(vin: string) {
    return {
      url: `${this.base}/api/v2/vin-decoding`,
      method: 'POST' as const,
      query: { api_token: this.redactedToken(), vin },
    };
  }

  async vinDecoding(vin: string): Promise<Record<string, unknown>> {
    return this.post<Record<string, unknown>>('/api/v2/vin-decoding', { vin });
  }

  resetCounter() {
    this.requests = 0;
  }

  // ---------------- INTERNAL ----------------

  private async post<T = unknown>(path: string, query: Query): Promise<T> {
    if (this.dryRun) {
      return { data: [], meta: { dryRun: true, path, query } } as unknown as T;
    }
    if (!this.base || !this.token) {
      throw new HttpException(
        'Vendor config missing',
        HttpStatus.PRECONDITION_FAILED,
      );
    }

    if (this.requests >= this.maxReqPerRun) {
      throw new HttpException(
        `VendorClient limit reached (${this.maxReqPerRun})`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    this.requests++;

    const url = new URL(this.base + path);
    const sp = new URLSearchParams();
    sp.set('api_token', this.token);
    for (const [k, v] of Object.entries(query ?? {})) {
      if (v === undefined) continue;
      if (Array.isArray(v)) v.forEach((val) => sp.append(k, String(val)));
      else sp.set(k, String(v));
    }
    url.search = sp.toString();

    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), this.timeoutMs);

    // opcjonalne logowanie (token zamaskowany)
    const logEnabled = this.cfg.get<string>('VENDOR_LOG', '0') === '1';
    const redacted = url
      .toString()
      .replace(this.token, this.token ? this.token.slice(0, 4) + '…' : '');

    try {
      if (logEnabled) {
        console.log('[VendorClient] POST', redacted);
      }
      const res = await fetch(url, { method: 'POST', signal: ac.signal });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        const snippet = txt?.slice(0, 2048);
        const status = res.status as number;
        // mapujemy 4xx/5xx na HttpException o tym samym statusie
        throw new HttpException(
          {
            code: 'VENDOR_ERROR',
            status,
            url: redacted,
            message: res.statusText || 'Vendor error',
            bodySnippet: snippet,
          },
          status >= 400 && status <= 599 ? status : HttpStatus.BAD_GATEWAY,
        );
      }

      return (await res.json()) as T;
    } catch (e: unknown) {
      // Abort -> 504
      if (e instanceof DOMException && e.name === 'AbortError') {
        throw new HttpException(
          { code: 'VENDOR_TIMEOUT', url: redacted, timeoutMs: this.timeoutMs },
          HttpStatus.GATEWAY_TIMEOUT,
        );
      }
      // wszystko inne
      throw e;
    } finally {
      clearTimeout(t);
    }
  }

  private redactedToken() {
    return this.token ? `${this.token.slice(0, 4)}…` : '';
  }
}
