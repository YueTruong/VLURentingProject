import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  // API bắt đầu chat (VD: Sinh viên bấm nút "Chat ngay" trên bài đăng)
  @Post('start')
  async startChat(@Body() body: { studentId: number; landlordId: number }) {
    return this.chatService.getConversation(body.studentId, body.landlordId);
  }

  // API lấy tin nhắn cũ
  @Get(':conversationId/messages')
  async getMessages(@Param('conversationId') conversationId: number) {
    return this.chatService.getMessages(conversationId);
  }

  // API lấy danh sách chat của user (cho sidebar)
  @Get('my-conversations')
  async getMyConversations(@Query('userId') userId: number) {
    return this.chatService.getUserConversations(userId);
  }
}
