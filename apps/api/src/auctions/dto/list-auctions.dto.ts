import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListAuctionsDto {
  @ApiPropertyOptional({ example: 'SCHEDULED', enum: ['SCHEDULED','LIVE','ENDED','CANCELLED'] })
  @IsOptional()
  @IsIn(['SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED'])
  status?: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';

  @ApiPropertyOptional({ description: 'Szukaj po tytule lub VIN', example: 'audi' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'endsAt', enum: ['endsAt','createdAt','currentPrice'] })
  @IsOptional()
  @IsIn(['endsAt','createdAt','currentPrice'])
  sort?: 'endsAt' | 'createdAt' | 'currentPrice';

  @ApiPropertyOptional({ example: 'asc', enum: ['asc','desc'] })
  @IsOptional()
  @IsIn(['asc','desc'])
  order?: 'asc' | 'desc';

  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt() @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, minimum: 1, default: 10 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt() @Min(1)
  limit?: number;

  @IsOptional()
  @IsBooleanString()
  showEnded?: 'true' | 'false';
}
