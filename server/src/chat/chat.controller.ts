import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  // API: Tạo cuộc hội thoại (Ví dụ: Bấm nút "Liên hệ" trên Frontend)
  @Post('create')
  async createConversation(
    @Body() body: { studentId: number; landlordId: number },
  ) {
    return this.chatService.getOrCreateConversation(
      body.studentId,
      body.landlordId,
    );
  }

  // API: Lấy lịch sử tin nhắn
  @Get(':conversationId/messages')
  async getHistory(@Param('conversationId') conversationId: number) {
    return this.chatService.getMessages(conversationId);
  }
}
