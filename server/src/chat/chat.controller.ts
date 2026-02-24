import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Đảm bảo đường dẫn này đúng với dự án của em

@Controller('chat')
@UseGuards(JwtAuthGuard) // 🔒 Bảo vệ toàn bộ API chat, bắt buộc phải có Token hợp lệ
export class ChatController {
  constructor(private chatService: ChatService) {}

  // API bắt đầu chat
  @Post('init')
  async startChat(@Req() req, @Body() body: { partnerId: number }) {
    // Tự động lấy ID người đang đăng nhập từ Token (không sợ bị fake ID)
    const currentUserId = Number(
      req.user.id || req.user.sub || req.user.userId,
    );
    const role = req.user.role?.toLowerCase();

    let studentId: number;
    let landlordId: number;

    // Phân loại ai là Student, ai là Landlord
    if (role === 'student') {
      studentId = currentUserId;
      landlordId = Number(body.partnerId);
    } else {
      landlordId = currentUserId;
      studentId = Number(body.partnerId);
    }

    return this.chatService.getConversation(studentId, landlordId);
  }

  // API lấy tin nhắn cũ
  @Get(':conversationId/messages')
  async getMessages(@Param('conversationId') conversationId: number, @Req() req) {
    const currentUserId = Number(
      req.user.id || req.user.sub || req.user.userId,
    );
    return this.chatService.getMessagesForUser(Number(conversationId), currentUserId);
  }

  // API lấy danh sách chat của user (cho sidebar)
  @Get('my-conversations')
  async getMyConversations(@Req() req) {
    // 🛡️ LẤY USER ID TỪ TOKEN (Giải quyết dứt điểm lỗi hiển thị nhầm chat)
    const currentUserId = Number(
      req.user.id || req.user.sub || req.user.userId,
    );

    return this.chatService.getUserConversations(currentUserId);
  }
}
