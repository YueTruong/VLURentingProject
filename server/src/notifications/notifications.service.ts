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

  private normalizeNotificationText(text: string) {
    if (!text) return text;

    return text
      .replace(/Yeu cau o ghep moi can duyet/gi, 'Yêu cầu ở ghép mới cần duyệt')
      .replace(/Yeu cau o ghep da duoc duyet/gi, 'Yêu cầu ở ghép đã được duyệt')
      .replace(/Yeu cau o ghep bi tu choi/gi, 'Yêu cầu ở ghép bị từ chối')
      .replace(/Yeu cau o ghep dang cho duyet/gi, 'Yêu cầu ở ghép đang chờ duyệt')
      .replace(/Yeu cau o ghep cho phong/gi, 'Yêu cầu ở ghép cho phòng')
      .replace(/da duoc admin chap nhan va da hien thi trong listings/gi, 'đã được quản trị viên chấp nhận và đã hiển thị công khai')
      .replace(/da duoc admin chap nhan/gi, 'đã được quản trị viên chấp nhận')
      .replace(/da bi admin tu choi/gi, 'đã bị quản trị viên từ chối')
      .replace(/dang cho admin xac nhan/gi, 'đang chờ quản trị viên duyệt')
      .replace(/da duoc chuyen ve trang thai cho duyet/gi, 'đã được chuyển về trạng thái chờ duyệt')
      .replace(/Tin nhan moi tu/gi, 'Tin nhắn mới từ')
      .replace(/Dang cho ban phan hoi/gi, 'Đang chờ bạn phản hồi')
      .replace(/Yeu cau xem phong moi/gi, 'Yêu cầu xem phòng mới')
      .replace(/Cap nhat lich xem phong/gi, 'Cập nhật lịch xem phòng')
      .replace(/Lich hen da bi huy/gi, 'Lịch hẹn đã bị hủy')
      .replace(/lich hen xem phong/gi, 'lịch hẹn xem phòng')
      .replace(/bai dang/gi, 'bài đăng')
      .replace(/Nha tro/gi, 'Nhà trọ')
      .replace(/Can ho/gi, 'Căn hộ');
  }

  private normalizeNotificationEntity(notification: NotificationEntity) {
    const nextTitle = this.normalizeNotificationText(notification.title);
    const nextMessage = this.normalizeNotificationText(notification.message);
    const changed =
      nextTitle !== notification.title || nextMessage !== notification.message;

    if (changed) {
      notification.title = nextTitle;
      notification.message = nextMessage;
    }

    return { notification, changed };
  }

  // Lấy danh sách thông báo của user
  async findMyNotifications(userId: number) {
    const notifications = await this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' }, // Mới nhất lên đầu
    });

    const changedNotifications = notifications
      .map((notification) => this.normalizeNotificationEntity(notification))
      .filter((item) => item.changed)
      .map((item) => item.notification);

    if (changedNotifications.length > 0) {
      await this.repo.save(changedNotifications);
    }

    return notifications;
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
    const notif = this.repo.create({
      userId,
      title: this.normalizeNotificationText(title),
      message: this.normalizeNotificationText(message),
      type,
      relatedId,
    });
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
