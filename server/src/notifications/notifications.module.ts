import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationEntity } from 'src/database/entities/notification.entity';

@Module({
  // 1. Đăng ký Entity để Service tương tác với Database
  imports: [TypeOrmModule.forFeature([NotificationEntity])],

  // 2. Đăng ký Controller để mở API
  controllers: [NotificationsController],

  // 3. Đăng ký Service để xử lý logic
  providers: [NotificationsService],

  // 4. Xuất Service để các module khác (như PostsModule) có thể gọi
  exports: [NotificationsService],
})
export class NotificationsModule {}
