import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

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

  // Kích hoạt CORS (Quan trọng để ReactJS gọi được API)
  app.enableCors({
    origin: ['http://localhost:3000', 'https://vlu-renting-client.vercel.app'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Kích hoạt Validation tự động
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const dataSource = app.get(DataSource);
  await ensurePostsSchema(dataSource);

  // Cấu hình Swagger
  const config = new DocumentBuilder()
    .setTitle('VLU Renting APIs')
    .setDescription('Tài liệu API cho ứng dụng VLU Renting')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Truy cập tại localhost:3000/api

  await app.listen(3001);
}
bootstrap();
