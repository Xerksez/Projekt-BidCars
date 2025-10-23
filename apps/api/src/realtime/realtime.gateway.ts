import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/ws',
  transports: ['websocket'], // stabilne WS (bez pollingu)
  cors: {
    origin: true, // dev: pozwól na http://localhost:3000
    credentials: true, // jeżeli planujesz auth po cookie
  },
})
export class RealtimeGateway {
  @WebSocketServer() server: Server;

  // Klient dołącza do pokoju aukcji
  @SubscribeMessage('auction.join')
  handleJoin(
    @MessageBody() data: { auctionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data?.auctionId) {
      client.join(this.room(data.auctionId));
      client.emit('auction.joined', { ok: true, auctionId: data.auctionId });
    } else {
      client.emit('error', { message: 'auctionId is required' });
    }
  }

  // (opcjonalnie) klient opuszcza pokój
  @SubscribeMessage('auction.leave')
  handleLeave(
    @MessageBody() data: { auctionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data?.auctionId) {
      client.leave(this.room(data.auctionId));
      client.emit('auction.left', { ok: true, auctionId: data.auctionId });
    }
  }

  // --- Emity używane przez serwisy ---

  emitBidCreated(payload: {
    auctionId: string;
    bidId: string;
    amount: number;
    user: { id: string; email: string; name?: string | null };
    at: string | Date;
  }) {
    this.server.to(this.room(payload.auctionId)).emit('bid.created', payload);
  }

  emitAuctionExtended(payload: {
    auctionId: string;
    endsAt: string;
    extendedBySec: number;
  }) {
    this.server
      .to(this.room(payload.auctionId))
      .emit('auction.extended', payload);
  }

  emitAuctionStatus(payload: {
    auctionId: string;
    status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
    startsAt?: string | Date;
    endsAt?: string | Date;
    currentPrice?: number;
  }) {
    this.server
      .to(this.room(payload.auctionId))
      .emit('auction.status', payload);
  }

  // --- Helpers ---
  private room(auctionId: string) {
    return `auction:${auctionId}`;
  }
}
