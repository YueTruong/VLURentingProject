import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: { origin: '*' }, // Cho phép Frontend gọi vào
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  // 👇 Inject ChatService vào để dùng
  constructor(private chatService: ChatService) {}

  // 1. Join phòng chat
  @SubscribeMessage('join_room')
  handleJoinRoom(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`conversation_${conversationId}`);
    console.log(`Client ${client.id} đã vào phòng chat ${conversationId}`);
  }

  // 2. Gửi tin nhắn (Vừa lưu DB, vừa gửi cho người kia)
  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody()
    data: {
      conversationId: number;
      senderId: number;
      content: string;
    },
  ) {
    console.log('📩 Nhận tin nhắn:', data);

    // BƯỚC QUAN TRỌNG: Lưu vào DB
    const savedMessage = await this.chatService.saveMessage(
      data.conversationId,
      data.senderId,
      data.content,
    );

    // Gửi tin nhắn đã lưu (có ID, created_at) cho tất cả người trong phòng
    this.server
      .to(`conversation_${data.conversationId}`)
      .emit('receive_message', savedMessage);
  }
}
