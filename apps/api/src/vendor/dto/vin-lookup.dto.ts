import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class VinLookupDto {
  @ApiProperty({ example: '5UXKR0C52G0P21189' })
  @IsString()
  vin_number!: string;

  @ApiProperty({ required: false, example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  only_with_color?: number;
}
