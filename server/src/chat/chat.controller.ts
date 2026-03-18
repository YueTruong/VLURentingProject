import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequestUser } from '../auth/types/auth.types';
import { ChatService } from './chat.service';

type AuthenticatedRequest = Request & {
  user: AuthenticatedRequestUser;
};

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('init')
  async startChat(
    @Req() req: AuthenticatedRequest,
    @Body() body: { partnerId: number },
  ) {
    const currentUserId = Number(req.user.userId || req.user.id);
    const role = req.user.role?.toLowerCase();

    const partnerId = Number(body.partnerId);
    let studentId: number;
    let landlordId: number;

    if (role === 'student') {
      studentId = currentUserId;
      landlordId = partnerId;
    } else {
      landlordId = currentUserId;
      studentId = partnerId;
    }

    return this.chatService.getConversation(studentId, landlordId);
  }

  @Get(':conversationId/messages')
  async getMessages(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.chatService.getMessagesForUser(
      conversationId,
      Number(req.user.userId || req.user.id),
    );
  }

  @Get('my-conversations')
  async getMyConversations(@Req() req: AuthenticatedRequest) {
    return this.chatService.getUserConversations(
      Number(req.user.userId || req.user.id),
    );
  }
}
