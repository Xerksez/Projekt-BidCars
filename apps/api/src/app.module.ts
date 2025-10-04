import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuctionsModule } from './auctions/auctions.module';
import { UsersModule } from './users/users.module';
import { BidsModule } from './bids/bids.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PhotosModule } from './photos/photos.module';
import { ImportController } from './import/import.controller';
import { AuctionsImportService } from './import/auctions-import.service';
import { ThrottlerModule } from '@nestjs/throttler';
//import { VendorModule } from './vendor/vendor.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuctionsModule,
    UsersModule,
    BidsModule,
    PhotosModule,
    ThrottlerModule.forRoot([ { ttl: 60_000, limit: 100 } ]),
    //VendorModule,
  ],
  controllers: [AppController, ImportController],
  providers: [AuctionsImportService],
})
export class AppModule {}
