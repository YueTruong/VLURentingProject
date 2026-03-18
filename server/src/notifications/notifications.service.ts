import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { NotificationEntity } from 'src/database/entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repo: Repository<NotificationEntity>,
    private readonly configService: ConfigService,
  ) {}

  private normalizeNotificationText(text: string) {
    if (!text) {
      return text;
    }

    return text
      .replace(/Yeu cau xac nhan o ghep/gi, 'Yeu cau xac nhan o ghep')
      .replace(/Yeu cau o ghep moi can duyet/gi, 'Yeu cau o ghep moi can duyet')
      .replace(/Yeu cau o ghep da duoc duyet/gi, 'Yeu cau o ghep da duoc duyet')
      .replace(/Yeu cau o ghep bi tu choi/gi, 'Yeu cau o ghep bi tu choi')
      .replace(/Yeu cau o ghep dang cho duyet/gi, 'Yeu cau o ghep dang cho duyet')
      .replace(/Yeu cau o ghep cho phong/gi, 'Yeu cau o ghep cho phong')
      .replace(/Mot sinh vien da tao nhu cau o ghep/gi, 'Mot sinh vien da tao nhu cau o ghep')
      .replace(
        /da duoc admin chap nhan va da hien thi trong listings/gi,
        'da duoc admin chap nhan va da hien thi trong listings',
      )
      .replace(/da duoc admin chap nhan/gi, 'da duoc admin chap nhan')
      .replace(/da bi admin tu choi/gi, 'da bi admin tu choi')
      .replace(/dang cho admin xac nhan/gi, 'dang cho admin xac nhan')
      .replace(/da duoc chuyen ve trang thai cho duyet/gi, 'da duoc chuyen ve trang thai cho duyet')
      .replace(/Tin nhan moi tu/gi, 'Tin nhan moi tu')
      .replace(/Dang cho ban phan hoi/gi, 'Dang cho ban phan hoi')
      .replace(/Yeu cau xem phong moi/gi, 'Yeu cau xem phong moi')
      .replace(/Cap nhat lich xem phong/gi, 'Cap nhat lich xem phong')
      .replace(/Lich hen da bi huy/gi, 'Lich hen da bi huy');
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

  private getThrottleWindowMs() {
    const rawWindow = Number(
      this.configService.get<string>('NOTIFICATION_RATE_LIMIT_MS') || '30000',
    );
    return Number.isFinite(rawWindow) && rawWindow >= 0 ? rawWindow : 30000;
  }

  async findMyNotifications(userId: number) {
    const notifications = await this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
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

  async markAsRead(id: number, userId: number) {
    const notif = await this.repo.findOneBy({ id, userId });
    if (!notif) {
      throw new NotFoundException('Thong bao khong ton tai');
    }

    notif.isRead = true;
    return this.repo.save(notif);
  }

  async markAllAsRead(userId: number) {
    await this.repo.update({ userId, isRead: false }, { isRead: true });
    return { success: true };
  }

  async createNotification(
    userId: number,
    title: string,
    message: string,
    type: string,
    relatedId?: number,
  ) {
    const normalizedTitle = this.normalizeNotificationText(title);
    const normalizedMessage = this.normalizeNotificationText(message);

    if (type === 'message') {
      const existingMessageNotification = await this.repo.findOne({
        where: {
          userId,
          type: 'message',
          relatedId: relatedId ?? null,
          isRead: false,
        },
        order: { createdAt: 'DESC' },
      });

      if (existingMessageNotification) {
        existingMessageNotification.title = normalizedTitle;
        existingMessageNotification.message = normalizedMessage;
        return this.repo.save(existingMessageNotification);
      }
    }

    const throttleWindowMs = this.getThrottleWindowMs();
    if (throttleWindowMs > 0) {
      const recentNotification = await this.repo.findOne({
        where: {
          userId,
          type,
          relatedId: relatedId ?? null,
          title: normalizedTitle,
          createdAt: MoreThan(new Date(Date.now() - throttleWindowMs)),
        },
        order: { createdAt: 'DESC' },
      });

      if (recentNotification) {
        recentNotification.message = normalizedMessage;
        return this.repo.save(recentNotification);
      }
    }

    const notif = this.repo.create({
      userId,
      title: normalizedTitle,
      message: normalizedMessage,
      type,
      relatedId,
    });
    return this.repo.save(notif);
  }

  async countUnread(userId: number) {
    const count = await this.repo.count({
      where: {
        userId,
        isRead: false,
      },
    });
    return { count };
  }
}
