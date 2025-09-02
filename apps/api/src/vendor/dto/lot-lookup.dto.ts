import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class LotLookupDto {
  @ApiProperty({ example: 40365342 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  lot_number!: number;

  @ApiProperty({ required: false, example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  only_with_color?: number;
}
