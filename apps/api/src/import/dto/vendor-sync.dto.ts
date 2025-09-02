// apps/api/src/import/dto/vendor-sync.dto.ts
export type VendorAuctionDto = {
  externalId: string;
  title: string;
  vin?: string | null;
  startsAt: string;
  endsAt: string;
  images?: string[];
  currentPrice?: number;
  softCloseSec?: number;
  status?: 'SCHEDULED' | 'LIVE' | 'CANCELLED' | 'ENDED';
};

export class VendorSyncDto {
  source!: string;
  // jedno z poniższych pola będzie używane w danym endpointzie
  auction?: VendorAuctionDto;
  auctions?: VendorAuctionDto[];
}
