import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { TrackingService } from './tracking.service';

interface TrackingClient {
  orderId: string;
  socket: Socket;
}

@WebSocketGateway({
  namespace: 'tracking',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class TrackingGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TrackingGateway.name);
  private trackingClients: Map<string, TrackingClient[]> = new Map();

  constructor(private readonly trackingService: TrackingService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    // Register this gateway with the tracking service
    this.trackingService.setTrackingGateway(this);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Remove client from all tracked orders
    this.trackingClients.forEach((clients, orderId) => {
      const index = clients.findIndex(c => c.socket.id === client.id);
      if (index !== -1) {
        clients.splice(index, 1);
        this.logger.log(`Removed client ${client.id} from tracking order ${orderId}`);
      }

      // Clean up empty arrays
      if (clients.length === 0) {
        this.trackingClients.delete(orderId);
      }
    });
  }

  /**
   * Client subscribes to track an order
   */
  @SubscribeMessage('track_order')
  async handleTrackOrder(
    @MessageBody() data: { orderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { orderId } = data;

    this.logger.log(`Client ${client.id} tracking order ${orderId}`);

    // Add client to tracking list
    if (!this.trackingClients.has(orderId)) {
      this.trackingClients.set(orderId, []);
    }

    const clients = this.trackingClients.get(orderId);
    if (!clients.some(c => c.socket.id === client.id)) {
      clients.push({ orderId, socket: client });
    }

    // Send initial tracking data
    try {
      const trackingData = await this.trackingService.trackOrder(orderId);
      client.emit('tracking_update', trackingData);
    } catch (error) {
      this.logger.error(`Failed to get tracking data for order ${orderId}`, error.message);
      client.emit('tracking_error', { orderId, message: 'Failed to get tracking data' });
    }

    return { success: true, message: `Tracking order ${orderId}` };
  }

  /**
   * Client unsubscribes from tracking an order
   */
  @SubscribeMessage('untrack_order')
  handleUntrackOrder(
    @MessageBody() data: { orderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { orderId } = data;

    const clients = this.trackingClients.get(orderId);
    if (clients) {
      const index = clients.findIndex(c => c.socket.id === client.id);
      if (index !== -1) {
        clients.splice(index, 1);
        this.logger.log(`Client ${client.id} stopped tracking order ${orderId}`);
      }

      if (clients.length === 0) {
        this.trackingClients.delete(orderId);
      }
    }

    return { success: true, message: `Stopped tracking order ${orderId}` };
  }

  /**
   * Broadcast location update to all clients tracking an order
   */
  async broadcastLocationUpdate(orderId: string, riderId: string) {
    const clients = this.trackingClients.get(orderId);

    if (!clients || clients.length === 0) {
      return; // No one is tracking this order
    }

    try {
      const trackingData = await this.trackingService.trackOrder(orderId);

      // Broadcast to all clients tracking this order
      clients.forEach(client => {
        client.socket.emit('tracking_update', trackingData);
      });

      this.logger.log(`Broadcasted location update for order ${orderId} to ${clients.length} clients`);
    } catch (error) {
      this.logger.error(`Failed to broadcast location update for order ${orderId}`, error.message);
    }
  }

  /**
   * Broadcast order status change
   */
  async broadcastStatusChange(orderId: string, status: string) {
    const clients = this.trackingClients.get(orderId);

    if (!clients || clients.length === 0) {
      return;
    }

    clients.forEach(client => {
      client.socket.emit('status_change', { orderId, status });
    });

    this.logger.log(`Broadcasted status change for order ${orderId}: ${status}`);
  }

  /**
   * Get count of active tracking sessions
   */
  getActiveTrackingSessions(): number {
    let total = 0;
    this.trackingClients.forEach(clients => {
      total += clients.length;
    });
    return total;
  }

  /**
   * Get orders being tracked
   */
  getTrackedOrders(): string[] {
    return Array.from(this.trackingClients.keys());
  }
}
