import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { AdminModule } from './admin/admin.module';
import { ReviewsModule } from './reviews/reviews.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';

@Module({
  imports: [
    // Tải file .env và biến nó thành các biến môi trường
    ConfigModule.forRoot({
      isGlobal: true, // Cho phép ConfigModule được sử dụng ở mọi nơi
      envFilePath: '.env', // Chỉ định tên file .env
    }),

    // Cấu hình kết nối Database (TypeORM)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,

        // Tự động tìm và tải các Entities (models)
        entities: [__dirname + '/**/*.entity{.ts,.js}'],

        // Tự động đồng bộ schema (chỉ dùng cho development)
        // Khi ở production, chúng ta sẽ dùng migrations
        synchronize: true, // <-- TẠM THỜI ĐỂ LÀ true
      }),
    }),

    AuthModule,

    PostsModule,

    AdminModule,

    ReviewsModule,

    CloudinaryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
