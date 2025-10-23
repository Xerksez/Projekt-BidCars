import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import { UPLOAD_DIR, ensureUploadDir } from './paths';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/http-exception.filter';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // żeby obrazki z /uploads działały z web
    }),
  );

  app.enableCors({
    origin: (origin, cb) => cb(null, true), // dev: dowolne
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization, x-api-key',
    methods: 'GET,POST,PATCH,DELETE,OPTIONS',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      // ⬇️ kluczowe:
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('BidCars API')
    .setDescription('Public + admin endpoints')
    .setVersion('1.0')
    // Bearer (JWT) – dla zwykłych userów
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'bearer',
    )
    // x-api-key – dla akcji admina / systemowych
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'Admin API key',
      },
      'x-api-key',
    )
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/docs', app, doc);

  // STATIC: /uploads -> <repo_root>/uploads
  ensureUploadDir();
  app.use('/uploads', express.static(UPLOAD_DIR));
  console.log('[STATIC] Serving /uploads from:', UPLOAD_DIR);

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  console.log(`[STATIC] Serving /uploads from: ${UPLOAD_DIR}`);
}
bootstrap();
