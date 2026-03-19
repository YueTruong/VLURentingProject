declare module '@nestjs/websockets' {
  export interface OnGatewayConnection {
    handleConnection(client: unknown): void;
  }

  export interface OnGatewayDisconnect {
    handleDisconnect(client: unknown): void;
  }

  export function WebSocketGateway(options?: Record<string, unknown>): ClassDecorator;
  export function WebSocketServer(): PropertyDecorator;
  export function SubscribeMessage(message: string): MethodDecorator;
  export function MessageBody(): ParameterDecorator;
  export function ConnectedSocket(): ParameterDecorator;
}

declare module 'socket.io' {
  export class Server {
    emit(event: string, payload?: unknown): void;
    to(roomId: string): { emit(event: string, payload?: unknown): void };
    sockets: {
      adapter: {
        rooms: Map<string, Set<string>>;
      };
    };
  }

  export class Socket {
    id: string;
    emit(event: string, payload?: unknown): void;
    join(roomId: string): void;
  }
}
