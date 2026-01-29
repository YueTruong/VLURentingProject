import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { AdminModule } from './admin/admin.module';
import { ReviewsModule } from './reviews/reviews.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { UsersModule } from './users/user.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');
        const nodeEnv = config.get<string>('NODE_ENV') || 'development';
        const isProd = nodeEnv === 'production';

        return {
          type: 'postgres',

          // Nếu có DATABASE_URL -> dùng Neon
          ...(databaseUrl
            ? { url: databaseUrl }
            : {
                host: config.get<string>('DB_HOST'),
                port: parseInt(config.get<string>('DB_PORT') || '5432', 10),
                username: config.get<string>('DB_USERNAME'),
                password: config.get<string>('DB_PASSWORD'),
                database: config.get<string>('DB_DATABASE'),
              }),

          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          autoLoadEntities: true,

          // Neon cần SSL
          ssl: databaseUrl ? { rejectUnauthorized: false } : false,
          extra: databaseUrl
            ? { ssl: { rejectUnauthorized: false } }
            : undefined,

          // Prod tuyệt đối không synchronize
          // synchronize: !isProd && !databaseUrl, // local dev mới true
          synchronize: !isProd,
          logging: !isProd,
        };
      },
    }),

    UsersModule,
    AuthModule,
    CloudinaryModule,
    PostsModule,
    AdminModule,
    ReviewsModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
