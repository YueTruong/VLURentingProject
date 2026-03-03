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

@WebSocketGateway({
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // 👇 MẢNG LƯU TRỮ USER ĐANG ONLINE (Mapping giữa socket.id và userId)
  private onlineUsers = new Map<string, number>();

  constructor(private chatService: ChatService) {}

  // 1. KHI CÓ NGƯỜI KẾT NỐI (Mới mở web, chưa biết là ai)
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  // 2. KHI CÓ NGƯỜI NGẮT KẾT NỐI (Tắt trình duyệt, mất mạng)
  handleDisconnect(client: Socket) {
    const userId = this.onlineUsers.get(client.id);
    if (userId) {
      // Xóa khỏi danh sách online
      this.onlineUsers.delete(client.id);
      console.log(`User offline: ${userId}`);

      // Phát thông báo cho tất cả mọi người là user này vừa offline
      this.server.emit('user_offline', userId);
    }
    console.log(`Client disconnected: ${client.id}`);
  }

  // 3. EVENT: NHẬN DIỆN USER KHI VỪA ĐĂNG NHẬP / VÀO TRANG CHAT
  @SubscribeMessage('user_connected')
  handleUserConnected(
    @MessageBody() userId: number,
    @ConnectedSocket() client: Socket,
  ) {
    // Lưu user vào Map
    this.onlineUsers.set(client.id, userId);
    console.log(`User online: ${userId} with socket ${client.id}`);

    // Báo cho tất cả client khác biết user này vừa online
    this.server.emit('user_online', userId);
  }

  // 4. EVENT: KIỂM TRA TRẠNG THÁI ONLINE CỦA 1 USER CỤ THỂ
  @SubscribeMessage('check_online_status')
  handleCheckOnlineStatus(
    @MessageBody() targetUserId: number,
    @ConnectedSocket() client: Socket,
  ) {
    // Kiểm tra xem ID người kia có nằm trong danh sách đang online không
    const isOnline = Array.from(this.onlineUsers.values()).includes(
      targetUserId,
    );

    // Gửi kết quả về lại đúng cho client vừa hỏi
    client.emit('online_status_result', { userId: targetUserId, isOnline });
  }

  // 5. THAM GIA PHÒNG CHAT TỪNG CẶP
  @SubscribeMessage('join_conversation')
  handleJoinRoom(
    @MessageBody() conversationId: number,
    @ConnectedSocket() client: Socket,
  ) {
    const roomId = `room_${conversationId}`;
    client.join(roomId);
  }

  // 6. GỬI TIN NHẮN
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

    // Lấy danh sách socket đang ở trong phòng chat này
    const roomSockets = this.server.sockets.adapter.rooms.get(roomId);
    const numClients = roomSockets ? roomSockets.size : 0;

    // Nếu có từ 2 người trở lên trong phòng -> Người kia đang xem trực tiếp
    const isReceiverWatching = numClients > 1;

    // Gọi Service lưu tin nhắn và truyền cờ này vào (Để quyết định có tạo Notification không)
    const savedMsg = await this.chatService.saveMessage(
      payload.conversationId,
      payload.senderId,
      payload.content,
      isReceiverWatching,
    );

    // Bắn tin nhắn mới qua Socket cho những ai đang ở trong phòng
    this.server.to(roomId).emit('new_message', savedMsg);
  }
}
