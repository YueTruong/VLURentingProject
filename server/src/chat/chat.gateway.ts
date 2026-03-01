import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private onlineUsers = new Map<string, number>();

  constructor(private chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`🟢 [Socket] Client kết nối: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const userId = this.onlineUsers.get(client.id);
    if (userId) {
      this.onlineUsers.delete(client.id);
      console.log(`🔴 [Socket] User offline: ${userId}`);
      this.server.emit('user_offline', userId);
    }
    console.log(`🔴 [Socket] Client ngắt kết nối: ${client.id}`);
  }

  @SubscribeMessage('user_connected')
  handleUserConnected(
    @MessageBody() userId: number,
    @ConnectedSocket() client: Socket,
  ) {
    this.onlineUsers.set(client.id, userId);
    console.log(
      `🙋‍♂️ [Socket] User ${userId} online với socket ID: ${client.id}`,
    );
    this.server.emit('user_online', userId);
  }

  @SubscribeMessage('check_online_status')
  handleCheckOnlineStatus(
    @MessageBody() targetUserId: number,
    @ConnectedSocket() client: Socket,
  ) {
    const isOnline = Array.from(this.onlineUsers.values()).includes(
      targetUserId,
    );
    client.emit('online_status_result', { userId: targetUserId, isOnline });
  }

  @SubscribeMessage('join_conversation')
  handleJoinRoom(
    @MessageBody() conversationId: number,
    @ConnectedSocket() client: Socket,
  ) {
    const roomId = `room_${conversationId}`;
    client.join(roomId);
    console.log(`🚪 [Socket] Socket ${client.id} đã tham gia phòng: ${roomId}`);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody()
    payload: { conversationId: number; senderId: number; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`\n📩 [Socket] NHẬN YÊU CẦU GỬI TIN NHẮN:`, payload);
    const roomId = `room_${payload.conversationId}`;

    const roomSockets = this.server.sockets.adapter.rooms.get(roomId);
    const numClients = roomSockets ? roomSockets.size : 0;
    console.log(
      `👥 [Socket] Số người đang có mặt trong ${roomId}: ${numClients}`,
    );

    const isReceiverWatching = numClients > 1;

    try {
      console.log(`⏳ [Socket] Đang lưu tin nhắn vào Database...`);
      const savedMsg = await this.chatService.saveMessage(
        payload.conversationId,
        payload.senderId,
        payload.content,
        isReceiverWatching,
      );
      console.log(
        `✅ [Socket] Lưu Database thành công! ID tin nhắn: ${savedMsg.id}`,
      );

      this.server.to(roomId).emit('new_message', savedMsg);
      console.log(`🚀 [Socket] Đã phát tin nhắn (emit) tới ${roomId}`);
    } catch (error) {
      console.error(
        `❌ [Socket] LỖI NGHIÊM TRỌNG KHI LƯU HOẶC PHÁT TIN NHẮN:`,
        error,
      );
    }
  }
}
