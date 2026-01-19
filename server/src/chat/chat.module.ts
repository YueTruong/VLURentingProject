import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { Conversation } from '../database/entities/conversation.entity';
import { Message } from '../database/entities/message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation, Message])], // Đăng ký Entity
  controllers: [ChatController],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
