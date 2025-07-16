import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface UserSocket {
  [userId: string]: Socket;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  userSockets: UserSocket = {};

  afterInit(server: Server) {
    console.log('Socket server initialized');
  }

  handleConnection(socket: Socket) {}

  handleDisconnect(socket: Socket) {
    const userId = Object.keys(this.userSockets).find(
      (key) => this.userSockets[key].id === socket.id,
    );
    if (userId) {
      delete this.userSockets[userId];
    }
  }

  @SubscribeMessage('register')
  registerUser(client: Socket, userId: string) {
    const user = userId.toString();
    this.userSockets[user] = client;
  }

  emitMessageToUser(userId: string, message: any) {
    const socket = this.userSockets[userId?.toString()];
    if (socket) {
      socket.emit('chat', message);
    }
  }
}
