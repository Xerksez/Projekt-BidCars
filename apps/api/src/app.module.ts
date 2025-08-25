import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuctionsModule } from './auctions/auctions.module';

@Module({
  imports: [PrismaModule, AuctionsModule],
  controllers: [AppController],
})
export class AppModule {}
