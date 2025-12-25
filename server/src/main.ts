import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Kích hoạt CORS (Quan trọng để ReactJS gọi được API)
  app.enableCors();

  // Kích hoạt Validation tự động
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

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
