import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('notifications')
export class NotificationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string; // Tương ứng với 'detail' ở FE

  @Column({ default: 'system' })
  type: string; // 'listing', 'message', 'system'

  @Column({ default: false })
  isRead: boolean; // Tương ứng với logic 'highlight' ở FE (highlight = !isRead)

  @Column({ nullable: true })
  relatedId: number; // ID của bài đăng hoặc tin nhắn liên quan (để click vào mở chi tiết)

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  userId: number;

  @ManyToOne(() => UserEntity, (user) => user.notifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;
}
