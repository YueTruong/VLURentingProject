import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationEntity } from '../database/entities/conversation.entity';
import { MessageEntity } from '../database/entities/message.entity';
import { UserEntity } from '../database/entities/user.entity';
import { NotificationsService } from 'src/notifications/notifications.service'; // Chỉnh lại đường dẫn nếu cần

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ConversationEntity)
    private conversationRepo: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private messageRepo: Repository<MessageEntity>,
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,

    private readonly notificationsService: NotificationsService,
  ) {}

  // Tạo hoặc lấy cuộc hội thoại giữa Student và Landlord
  async getConversation(studentId: number, landlordId: number) {
    let conversation = await this.conversationRepo.findOne({
      where: {
        student: { id: studentId },
        landlord: { id: landlordId },
      },
      relations: ['student', 'landlord'],
    });

    if (!conversation) {
      conversation = this.conversationRepo.create({
        student: { id: studentId },
        landlord: { id: landlordId },
      });
      await this.conversationRepo.save(conversation);
    }

    return conversation;
  }

  // Lưu tin nhắn mới vào DB
  async saveMessage(
    conversationId: number,
    senderId: number,
    content: string,
    isReceiverWatching: boolean = false,
  ) {
    const newMessage = this.messageRepo.create({
      conversation: { id: conversationId },
      sender: { id: senderId },
      content: content,
    });
    const savedMsg = await this.messageRepo.save(newMessage);

    // 👇 Cập nhật lại thời gian updated_at của Conversation để nó nhảy lên top sidebar
    await this.conversationRepo.update(conversationId, {
      updated_at: new Date(),
    });

    if (isReceiverWatching) {
      return savedMsg;
    }

    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
      relations: ['student', 'landlord'],
    });

    const sender = await this.userRepo.findOne({
      where: { id: senderId },
      relations: ['profile'],
    });

    if (conversation && sender) {
      const sId = Number(senderId);
      const receiverId =
        sId === conversation.student.id
          ? conversation.landlord.id
          : conversation.student.id;

      const senderName =
        sender.profile?.full_name || sender.email || 'Người dùng';

      const notifTitle = `Tin nhắn mới từ ${senderName}`;
      const notifMessage = 'Đang chờ bạn phản hồi...';

      await this.notificationsService.createNotification(
        receiverId,
        notifTitle,
        notifMessage,
        'message',
        sId,
      );
    }

    return savedMsg;
  }

  async getMessagesForUser(conversationId: number, userId: number) {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
      relations: ['student', 'landlord'],
    });

    if (!conversation) {
      throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
    }

    const isParticipant =
      conversation.student.id === userId || conversation.landlord.id === userId;

    if (!isParticipant) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập cuộc trò chuyện này',
      );
    }

    return this.getMessages(conversationId);
  }

  // Lấy lịch sử tin nhắn
  async getMessages(conversationId: number) {
    return await this.messageRepo.find({
      where: { conversation: { id: conversationId } },
      relations: ['sender'],
      order: { created_at: 'ASC' },
    });
  }

  // Lấy danh sách các cuộc hội thoại của 1 user
  async getUserConversations(userId: number) {
    return await this.conversationRepo.find({
      where: [{ student: { id: userId } }, { landlord: { id: userId } }],
      relations: [
        'student',
        'student.profile',
        'landlord',
        'landlord.profile',
        'messages',
      ],
      // Sắp xếp theo lần cập nhật gần nhất để hội thoại có tin nhắn mới nổi lên đầu
      order: { updated_at: 'DESC' },
    });
  }
}
