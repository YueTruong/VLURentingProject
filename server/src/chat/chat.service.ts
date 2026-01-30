import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationEntity } from '../database/entities/conversation.entity';
import { MessageEntity } from '../database/entities/message.entity';
import { UserEntity } from '../database/entities/user.entity';
import { NotificationsService } from 'src/notifications/notifications.service';

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
    // Tìm xem đã có chưa
    let conversation = await this.conversationRepo.findOne({
      where: {
        student: { id: studentId },
        landlord: { id: landlordId },
      },
      relations: ['student', 'landlord'],
    });

    // Chưa có thì tạo mới
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
    isReceiverWatching: boolean = false, // Mặc định là false
  ) {
    // 1. Lưu tin nhắn vào DB
    const newMessage = this.messageRepo.create({
      conversation: { id: conversationId },
      sender: { id: senderId },
      content: content,
    });
    const savedMsg = await this.messageRepo.save(newMessage);

    // 2. Nếu người nhận ĐANG XEM (Online trong phòng) -> KHÔNG TẠO THÔNG BÁO
    if (isReceiverWatching) {
      return savedMsg; // Kết thúc luôn
    }

    // 3. Logic tạo thông báo (khi người nhận không xem)
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

      // Tên người gửi
      const senderName =
        sender.profile?.full_name || sender.email || 'Người dùng';

      // --- YÊU CẦU CỦA EM: NỘI DUNG ẨN ---
      // Không hiện nội dung chat, chỉ báo có tin nhắn đang chờ
      const notifTitle = `Tin nhắn mới từ ${senderName}`;
      const notifMessage = 'Đang chờ bạn phản hồi...';

      // Gọi service (Nó sẽ tự gộp nếu đã có thông báo chưa đọc từ người này)
      await this.notificationsService.createNotification(
        receiverId,
        notifTitle,
        notifMessage,
        'message',
        sId, // relatedId để mở chat
      );
    }

    return savedMsg;
  }

  // Lấy lịch sử tin nhắn
  async getMessages(conversationId: number) {
    return await this.messageRepo.find({
      where: { conversation: { id: conversationId } },
      relations: ['sender'], // Load thông tin người gửi để hiển thị tên/avatar
      order: { created_at: 'ASC' },
    });
  }

  // Lấy danh sách các cuộc hội thoại của 1 user (để hiển thị list bên trái)
  async getUserConversations(userId: number) {
    return await this.conversationRepo.find({
      where: [{ student: { id: userId } }, { landlord: { id: userId } }],
      relations: ['student', 'landlord', 'messages'],
      order: { created_at: 'DESC' },
    });
  }
}
