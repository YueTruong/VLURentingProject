import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: { origin: '*' } }) // Cho phép mọi Client kết nối
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private chatService: ChatService) {}

  // 1. Client join vào phòng chat cụ thể
  @SubscribeMessage('join_conversation')
  handleJoinRoom(
    @MessageBody() conversationId: number,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`room_${conversationId}`);
    console.log(`User ${client.id} joined room_${conversationId}`);
  }

  // 2. Nhận tin nhắn từ Client -> Lưu DB -> Gửi lại cho người kia
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody()
    payload: {
      conversationId: number;
      senderId: number;
      content: string;
    },
  ) {
    // Lưu vào DB
    const savedMsg = await this.chatService.saveMessage(
      payload.conversationId,
      payload.senderId,
      payload.content,
    );

    // Gửi sự kiện 'new_message' cho tất cả người trong phòng này
    this.server
      .to(`room_${payload.conversationId}`)
      .emit('new_message', savedMsg);
  }
}
