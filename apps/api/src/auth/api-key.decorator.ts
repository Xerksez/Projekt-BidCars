import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { ApiSecurity } from '@nestjs/swagger';

export function AdminOnly() {
  return applyDecorators(
    UseGuards(ApiKeyGuard),
    ApiSecurity('apiKey'), // dla Swaggera
  );
}
