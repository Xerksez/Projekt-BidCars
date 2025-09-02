import { IsIn, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ListAuctionsDto {
  @IsOptional()
  @IsIn(['UPCOMING', 'LIVE', 'ENDED'])
  status?: 'UPCOMING' | 'LIVE' | 'ENDED';

  @IsOptional()
  @IsString()
  search?: string; // tytuł / VIN contains

  @IsOptional()
  @IsIn(['createdAt', 'endsAt', 'currentPrice'])
  sort?: 'createdAt' | 'endsAt' | 'currentPrice' = 'endsAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'asc';

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @IsPositive()
  page?: number = 1;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @IsPositive()
  limit?: number = 10;
}
