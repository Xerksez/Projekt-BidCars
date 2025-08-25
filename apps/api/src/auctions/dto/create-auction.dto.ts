import { IsISO8601, IsInt, IsOptional, IsString, Length, Matches, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAuctionDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(11, 17, { message: 'VIN must be between 11 and 17 characters' })
  @Matches(/^[A-HJ-NPR-Z0-9]+$/, { message: 'VIN must contain only valid characters' })
  vin?: string | null;

  @ApiProperty()
  @IsISO8601()
  startsAt: string;

  @ApiProperty()
  @IsISO8601()
  endsAt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  currentPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(30)
  softCloseSec?: number;
}
