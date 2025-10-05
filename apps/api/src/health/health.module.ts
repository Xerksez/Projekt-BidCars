import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // RedisModule jest globalny
  controllers: [HealthController],
})
export class HealthModule {}
