import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListV2Dto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() make?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() model?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() year_from?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() year_to?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() auction_name?: string;

  @ApiProperty({ required: false, example: '2023-01-01' })
  @IsOptional() @IsString() auction_date_from?: string;
  @ApiProperty({ required: false, example: '2023-12-31' })
  @IsOptional() @IsString() auction_date_to?: string;

  @ApiProperty({ required: false, example: 10 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) per_page?: number;
  @ApiProperty({ required: true, example: 1 })
  @Type(() => Number) @IsInt() @Min(1) page!: number;
}
