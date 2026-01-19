import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../database/entities/conversation.entity';
import { Message } from '../database/entities/message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
  ) {}

  // 1. Tìm hoặc Tạo cuộc hội thoại mới giữa 2 người
  async getOrCreateConversation(studentId: number, landlordId: number) {
    // Tìm xem đã có cuộc trò chuyện nào giữa 2 người này chưa
    let conversation = await this.conversationRepo.findOne({
      where: [
        { studentId, landlordId },
        // (Optional) Nếu muốn chat 2 chiều linh hoạt thì check thêm chiều ngược lại
      ],
      relations: ['messages'], // Load kèm tin nhắn cũ
    });

    // Nếu chưa có thì tạo mới
    if (!conversation) {
      conversation = this.conversationRepo.create({ studentId, landlordId });
      await this.conversationRepo.save(conversation);
    }

    return conversation;
  }

  // 2. Lưu tin nhắn mới vào DB
  async saveMessage(conversationId: number, senderId: number, content: string) {
    const newMessage = this.messageRepo.create({
      conversation: { id: conversationId }, // Link tới Conversation
      senderId,
      content,
    });
    return await this.messageRepo.save(newMessage);
  }

  // 3. Lấy lịch sử tin nhắn của 1 cuộc hội thoại
  async getMessages(conversationId: number) {
    return await this.messageRepo.find({
      where: { conversation: { id: conversationId } },
      order: { created_at: 'ASC' }, // Tin nhắn cũ xếp trước
    });
  }
}
