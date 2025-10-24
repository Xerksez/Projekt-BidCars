import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuctionsModule } from './auctions/auctions.module';
import { UsersModule } from './users/users.module';
import { BidsModule } from './bids/bids.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PhotosModule } from './photos/photos.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import type { IncomingMessage } from 'http';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { VendorClient } from './import/vendor.client';
import { AuctionsImportService } from './import/auctions-import.service';
import { ImportController } from './import/import.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuctionsModule,
    ConfigModule.forRoot({
      isGlobal: true, // <-- to sprawia, że ConfigService działa w każdym module
    }),
    UsersModule,
    BidsModule,
    RedisModule,
    HealthModule,
    PhotosModule,
    AuthModule,
     HttpModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : {
                target: 'pino-pretty',
                options: { singleLine: true, colorize: true },
              },

        // <-- TUTAJ
        customProps: (req: IncomingMessage) => {
          const rec = req as unknown as Record<string, unknown>;
          const ip =
            (rec['ip'] as string | undefined) ??
            req.socket?.remoteAddress ??
            null;

          const reqId = rec['id'] as string | undefined;
          const userAgent = req.headers['user-agent'];

          return { reqId, ip, userAgent };
        },
      },
    }),
  ],
  controllers: [AppController, ImportController],
  providers: [AuctionsImportService,VendorClient],
})
export class AppModule {}
