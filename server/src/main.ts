import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { buildHttpCorsOptions } from './common/config/cors.config';
import { shouldUseSchemaSync } from './common/config/database.config';

async function ensurePostsSchema(dataSource: DataSource) {
  const logger = new Logger('SchemaBootstrap');

  await dataSource.query(`
    ALTER TABLE IF EXISTS public.posts
    ADD COLUMN IF NOT EXISTS campus varchar(3);
  `);

  await dataSource.query(`
    ALTER TABLE IF EXISTS public.posts
    ADD COLUMN IF NOT EXISTS availability varchar(16) NOT NULL DEFAULT 'available';
  `);

  await dataSource.query(`
    ALTER TABLE IF EXISTS public.posts
    ADD COLUMN IF NOT EXISTS video_url text;
  `);

  logger.log('Checked posts schema columns (campus, availability, video_url).');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);

  app.enableCors(buildHttpCorsOptions(configService));
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const dataSource = app.get(DataSource);
  if (
    shouldUseSchemaSync(
      configService.get<string>('NODE_ENV'),
      configService.get<string>('DATABASE_URL'),
    )
  ) {
    await ensurePostsSchema(dataSource);
  }

  const config = new DocumentBuilder()
    .setTitle('VLU Renting APIs')
    .setDescription('Tai lieu API cho ung dung VLU Renting')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = Number(process.env.PORT || 3001);
  await app.listen(port);
  logger.log(`Server listening on port ${port}`);
}

bootstrap();
