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
    // 1. Nếu là tin nhắn chat, kiểm tra xem có thông báo nào CÙNG NGƯỜI GỬI (relatedId) và CHƯA ĐỌC không?
    if (type === 'message') {
      const existingNotif = await this.repo.findOne({
        where: {
          userId: userId, // Người nhận
          type: 'message', // Loại tin nhắn
          relatedId: relatedId, // ID người gửi
          isRead: false, // Chưa đọc
        },
      });

      // 2. Nếu đã có -> Chỉ cập nhật thời gian và nội dung chung chung
      if (existingNotif) {
        existingNotif.message = message; // Cập nhật lại nội dung (VD: "5 tin nhắn đang chờ")
        // Hack: Update lại createdAt bằng cách xóa đi tạo lại hoặc dùng QueryBuilder,
        // nhưng đơn giản nhất ở đây là ta save lại, TypeORM sẽ update 'updatedAt' nếu em có cột đó.
        // Để đẩy lên đầu danh sách, ta có thể xóa cái cũ và tạo cái mới, hoặc chấp nhận thứ tự cũ.
        // Cách tốt nhất: Xóa cái cũ, tạo cái mới để nó nhảy lên đầu.
        await this.repo.remove(existingNotif);
      }
    }

    // 3. Tạo thông báo mới (hoặc tái tạo cái vừa xóa để nó mới nhất)
    const notif = this.repo.create({ userId, title, message, type, relatedId });
    return this.repo.save(notif);
  }

  async countUnread(userId: number) {
    const count = await this.repo.count({
      where: {
        userId: userId,
        isRead: false,
      },
    });
    return { count };
  }
}
