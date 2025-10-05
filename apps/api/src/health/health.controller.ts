import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Controller()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get('/health')
  health() {
    return {
      ok: true,
      uptime: Math.round(process.uptime()),
      pid: process.pid,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('/ready')
  async ready() {
    const checks: Record<'db' | 'redis', boolean> = { db: false, redis: false };

    // DB
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.db = true;
    } catch {
      checks.db = false;
    }

    // Redis
    try {
      const pong = await this.redis.ping();
      checks.redis = pong === 'PONG';
    } catch {
      checks.redis = false;
    }

    return {
      ok: checks.db && checks.redis,
      ...checks,
      timestamp: new Date().toISOString(),
    };
  }
}
