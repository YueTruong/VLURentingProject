import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from 'src/database/entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private repo: Repository<NotificationEntity>,
  ) {}

  // Lấy danh sách thông báo của user
  async findMyNotifications(userId: number) {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' }, // Mới nhất lên đầu
    });
  }

  // Đánh dấu 1 thông báo là đã đọc
  async markAsRead(id: number, userId: number) {
    const notif = await this.repo.findOneBy({ id, userId });
    if (!notif) throw new NotFoundException('Thông báo không tồn tại');

    notif.isRead = true;
    return this.repo.save(notif);
  }

  // Đánh dấu tất cả là đã đọc
  async markAllAsRead(userId: number) {
    await this.repo.update({ userId, isRead: false }, { isRead: true });
    return { success: true };
  }

  // Hàm nội bộ để các module khác gọi khi cần bắn thông báo
  async createNotification(
    userId: number,
    title: string,
    message: string,
    type: string,
    relatedId?: number,
  ) {
    const notif = this.repo.create({ userId, title, message, type, relatedId });
    return this.repo.save(notif);
  }
}
