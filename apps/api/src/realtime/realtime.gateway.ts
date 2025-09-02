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
  cors: { origin: true }, // dev: pozwól na localhost:3000
})
export class RealtimeGateway {
  @WebSocketServer() server: Server;

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

  emitAuctionExtended(payload: {
    auctionId: string;
    endsAt: string;
    extendedBySec: number;
  }) {
    this.server
      .to(this.room(payload.auctionId))
      .emit('auction.extended', payload);
  }
  
emitAuctionStatus(payload: { auctionId: string; status: 'UPCOMING' | 'LIVE' | 'ENDED' }) {
  this.server.to(this.room(payload.auctionId)).emit('auction.status', payload);
}
  emitBidCreated(payload: {
    auctionId: string;
    bidId: string;
    amount: number;
    user: { id: string; email: string; name?: string | null };
    at: string | Date;
  }) {
    this.server.to(this.room(payload.auctionId)).emit('bid.created', payload);
  }

  private room(auctionId: string) {
    return `auction:${auctionId}`;
  }
}
