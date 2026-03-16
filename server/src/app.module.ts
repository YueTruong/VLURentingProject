import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { ChatModule } from './chat/chat.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { shouldUseSchemaSync } from './common/config/database.config';
import { NotificationsModule } from './notifications/notifications.module';
import { PostsModule } from './posts/posts.module';
import { ReviewsModule } from './reviews/reviews.module';
import { RoommateManagementModule } from './roommate-management/roommate-management.module';
import { UsersModule } from './users/user.module';

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
        const synchronize = shouldUseSchemaSync(nodeEnv, databaseUrl);

        return {
          type: 'postgres' as const,
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
          migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
          migrationsTableName: 'typeorm_migrations',
          ssl: databaseUrl ? { rejectUnauthorized: false } : false,
          extra: databaseUrl
            ? { ssl: { rejectUnauthorized: false } }
            : undefined,
          synchronize,
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
    NotificationsModule,
    AiModule,
    BookingsModule,
    RoommateManagementModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
