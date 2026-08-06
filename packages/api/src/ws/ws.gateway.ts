import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' } })
export class AppWsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AppWsGateway.name);

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const rawToken = client.handshake.auth?.token || client.handshake.query?.token as string;
      if (rawToken) {
        const cleanToken = rawToken.replace('Bearer ', '');
        let decoded: any = null;
        try {
          decoded = this.jwtService.verify(cleanToken, {
            secret: process.env.JWT_SECRET || 'super_secret_switchyard_jwt_key_2026',
          });
        } catch (e) {}

        if (decoded) {
          client.data.user = decoded;
          if (decoded.role === 'ADMIN') {
            client.join('admin');
          }
          if (decoded.tenantId) {
            client.join(`tenant:${decoded.tenantId}`);
          }
        }
      }
      this.logger.log(`Client ${client.id} connected to WebSocket Gateway`);
    } catch (err) {
      this.logger.log(`Client ${client.id} connected (public/guest)`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  broadcastToTenant(tenantId: string, event: string, data: any) {
    this.server.to(`tenant:${tenantId}`).to('admin').emit(event, data);
  }

  broadcastAll(event: string, data: any) {
    this.server.emit(event, data);
  }
}
