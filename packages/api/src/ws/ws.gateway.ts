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
      const token = client.handshake.auth?.token || client.handshake.query?.token as string;
      if (!token) {
        client.disconnect();
        return;
      }

      const decoded = this.jwtService.verify(token.replace('Bearer ', ''), {
        secret: process.env.JWT_SECRET || 'super_secret_switchyard_jwt_key_2026',
      });

      client.data.user = decoded;

      if (decoded.role === 'ADMIN') {
        client.join('admin');
        this.logger.log(`Client ${client.id} joined room admin`);
      }

      if (decoded.tenantId) {
        const tenantRoom = `tenant:${decoded.tenantId}`;
        client.join(tenantRoom);
        this.logger.log(`Client ${client.id} joined room ${tenantRoom}`);
      }
    } catch (e) {
      this.logger.warn(`WS Connection rejected: ${e.message}`);
      client.disconnect();
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
