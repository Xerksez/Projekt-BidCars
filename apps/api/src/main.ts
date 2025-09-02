import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { UPLOAD_DIR, ensureUploadDir } from './paths';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  ensureUploadDir();
  app.useStaticAssets(UPLOAD_DIR, { prefix: '/uploads/' });
  console.log('[STATIC] Serving /uploads from:', UPLOAD_DIR);

  const config = new DocumentBuilder()
    .setTitle('BidCars API')
    .setDescription('Aukcje i licytacje (dev)')
    .setVersion('1.0.0')
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/docs', app, doc);

  await app.listen(3001);
}
bootstrap();
