// apps/api/src/vendor/vendor.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { VendorService } from './vendor.service';
import { VendorController } from './vendor.controller';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000, // 10s
      maxRedirects: 5,
    }),
  ],
  providers: [VendorService],
  exports: [VendorService],
  controllers: [VendorController]
})
export class VendorModule {}
