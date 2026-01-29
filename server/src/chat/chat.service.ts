import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationEntity } from '../database/entities/conversation.entity';
import { MessageEntity } from '../database/entities/message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ConversationEntity)
    private conversationRepo: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private messageRepo: Repository<MessageEntity>,
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
  async saveMessage(conversationId: number, senderId: number, content: string) {
    const newMessage = this.messageRepo.create({
      conversation: { id: conversationId },
      sender: { id: senderId },
      content: content,
    });
    return await this.messageRepo.save(newMessage);
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
