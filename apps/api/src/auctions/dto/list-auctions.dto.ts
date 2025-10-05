import { IsInt, IsIn, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListAuctionsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED'])
  status?: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';

  // UWAGA: brak defaultów — jak NIE ma paramu, to NIE filtrujemy!
  @IsOptional()
  @IsIn(['0', '1'])
  excludeEnded?: '0' | '1';

  @IsOptional()
  @IsIn(['endsAt', 'createdAt', 'currentPrice'])
  sort?: 'endsAt' | 'createdAt' | 'currentPrice';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;
}
