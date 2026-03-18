import { Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { WsException } from '@nestjs/websockets/errors/ws-exception';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from 'src/auth/types/auth.types';
import { buildSocketCorsOptions } from 'src/common/config/cors.config';
import { ChatService } from './chat.service';

type SocketAuthData = {
  userId?: number;
  role?: string;
};

type AuthenticatedSocket = Socket & {
  data: SocketAuthData;
  handshake: {
    auth?: Record<string, unknown>;
    headers: Record<string, string | string[] | undefined>;
  };
  disconnect(close?: boolean): AuthenticatedSocket;
};

type SendMessagePayload = {
  conversationId: number;
  content: string;
  senderId?: number;
};

@WebSocketGateway({
  transports: ['websocket', 'polling'],
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly socketIdToUserId = new Map<string, number>();
  private readonly userSockets = new Map<number, Set<string>>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit() {
    const socketServer = this.server as Server & {
      engine?: { opts: { cors?: unknown } };
      use: (
        callback: (
          client: AuthenticatedSocket,
          next: (error?: Error) => void,
        ) => void | Promise<void>,
      ) => void;
    };

    if (socketServer.engine?.opts) {
      socketServer.engine.opts.cors = buildSocketCorsOptions(
        this.configService,
      );
    }

    socketServer.use(async (client: AuthenticatedSocket, next) => {
      try {
        const payload = await this.verifyClientToken(client);
        client.data.userId = Number(payload.sub);
        client.data.role = payload.role;
        next();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unauthorized socket';
        this.logger.warn(`Socket authentication failed: ${message}`);
        next(new Error(message));
      }
    });
  }

  handleConnection(client: AuthenticatedSocket) {
    const userId = client.data.userId;
    if (!userId) {
      this.logger.warn('Socket connection rejected because userId is missing');
      client.disconnect(true);
      return;
    }

    const isFirstConnection = this.trackSocket(userId, client.id);
    if (isFirstConnection) {
      this.server.emit('user_online', userId);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const status = this.untrackSocket(client.id);
    if (status && status.isOffline) {
      this.server.emit('user_offline', status.userId);
    }
  }

  @SubscribeMessage('user_connected')
  handleUserConnected(@ConnectedSocket() client: AuthenticatedSocket) {
    return { userId: this.getSocketUserId(client) };
  }

  @SubscribeMessage('check_online_status')
  handleCheckOnlineStatus(
    @MessageBody() targetUserId: number,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    this.getSocketUserId(client);

    const userSockets = this.userSockets.get(Number(targetUserId));
    const isOnline = Boolean(userSockets && userSockets.size > 0);
    client.emit('online_status_result', {
      userId: Number(targetUserId),
      isOnline,
    });
  }

  @SubscribeMessage('join_conversation')
  async handleJoinRoom(
    @MessageBody() conversationId: number,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const userId = this.getSocketUserId(client);
    await this.chatService.ensureConversationParticipant(
      Number(conversationId),
      userId,
    );

    await client.join(this.getRoomId(Number(conversationId)));
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() payload: SendMessagePayload,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const userId = this.getSocketUserId(client);
    const conversationId = Number(payload?.conversationId);
    if (!conversationId) {
      throw new WsException('conversationId is required');
    }

    const roomId = this.getRoomId(conversationId);
    const isReceiverWatching = this.isOtherParticipantWatching(roomId, userId);

    const savedMessage = await this.chatService.saveMessage(
      conversationId,
      userId,
      payload?.content ?? '',
      isReceiverWatching,
    );

    this.server.to(roomId).emit('new_message', savedMessage);
    return savedMessage;
  }

  private getRoomId(conversationId: number) {
    return `room_${conversationId}`;
  }

  private getSocketUserId(client: AuthenticatedSocket) {
    const userId = Number(client.data?.userId);
    if (!userId) {
      throw new WsException('Unauthorized socket');
    }

    return userId;
  }

  private async verifyClientToken(client: AuthenticatedSocket) {
    const rawToken =
      typeof client.handshake.auth?.token === 'string'
        ? client.handshake.auth.token
        : typeof client.handshake.headers.authorization === 'string'
          ? client.handshake.headers.authorization
          : null;

    const token = rawToken?.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      throw new UnauthorizedException('Missing socket token');
    }

    const payload = await this.jwtService.verifyAsync<
      JwtPayload & { roles?: string; id?: number; userId?: number }
    >(token);
    const userId = Number(payload.sub || payload.userId || payload.id);
    if (!userId) {
      throw new UnauthorizedException('Invalid socket token payload');
    }

    return {
      ...payload,
      sub: userId,
      role:
        typeof payload.role === 'string'
          ? payload.role.toLowerCase()
          : typeof payload.roles === 'string'
            ? payload.roles.toLowerCase()
            : undefined,
    };
  }

  private trackSocket(userId: number, socketId: string) {
    this.socketIdToUserId.set(socketId, userId);

    let sockets = this.userSockets.get(userId);
    const isFirstConnection = !sockets || sockets.size === 0;
    if (!sockets) {
      sockets = new Set<string>();
      this.userSockets.set(userId, sockets);
    }

    sockets.add(socketId);
    return isFirstConnection;
  }

  private untrackSocket(socketId: string) {
    const userId = this.socketIdToUserId.get(socketId);
    if (!userId) {
      return null;
    }

    this.socketIdToUserId.delete(socketId);
    const sockets = this.userSockets.get(userId);
    if (!sockets) {
      return { userId, isOffline: true };
    }

    sockets.delete(socketId);
    if (sockets.size === 0) {
      this.userSockets.delete(userId);
      return { userId, isOffline: true };
    }

    return { userId, isOffline: false };
  }

  private isOtherParticipantWatching(roomId: string, senderUserId: number) {
    const roomSockets = this.server.sockets.adapter.rooms.get(roomId);
    if (!roomSockets || roomSockets.size === 0) {
      return false;
    }

    for (const socketId of roomSockets) {
      const roomUserId = this.socketIdToUserId.get(socketId);
      if (roomUserId && roomUserId !== senderUserId) {
        return true;
      }
    }

    return false;
  }
}
