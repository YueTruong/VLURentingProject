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

  @SubscribeMessage('join_conversation')
  handleJoinRoom(
    @MessageBody() conversationId: number,
    @ConnectedSocket() client: Socket,
  ) {
    const roomId = `room_${conversationId}`;
    client.join(roomId);

    // (Optional) Có thể báo cho người kia biết mình đã vào xem (Seen status)
    // this.server.to(roomId).emit('user_joined', { userId: ... });
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody()
    payload: {
      conversationId: number;
      senderId: number;
      content: string;
    },
  ) {
    const roomId = `room_${payload.conversationId}`;

    // 👇 LOGIC KIỂM TRA ONLINE
    // Lấy danh sách socket đang ở trong phòng này
    const roomSockets = this.server.sockets.adapter.rooms.get(roomId);
    const numClients = roomSockets ? roomSockets.size : 0;

    // Nếu có từ 2 người trở lên trong phòng -> Người kia đang xem
    const isReceiverWatching = numClients > 1;

    // Gọi Service lưu tin nhắn và truyền cờ này vào
    const savedMsg = await this.chatService.saveMessage(
      payload.conversationId,
      payload.senderId,
      payload.content,
      isReceiverWatching, // 👈 Truyền vào đây
    );

    // Gửi tin nhắn qua Socket như bình thường
    this.server.to(roomId).emit('new_message', savedMsg);
  }
}
