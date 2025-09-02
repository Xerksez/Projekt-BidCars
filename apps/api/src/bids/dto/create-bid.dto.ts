import { IsInt, IsPositive, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBidDto {
  @ApiProperty({ example: 15000 })
  @IsInt()
  @IsPositive()
  amount: number;

  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Auction ID' })
  @IsString()
  auctionId: string;
}
