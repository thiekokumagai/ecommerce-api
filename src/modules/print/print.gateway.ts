import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../prisma/prisma.service';

@WebSocketGateway({ cors: true })
export class PrintGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly prisma: PrismaService) {}

  handleConnection(client: Socket) {
    const storeId = client.handshake.query.store_id;
    if (storeId) {
      client.join(`loja_${storeId}`);
      console.log(`🖨️ Print Agent conectado! Loja: ${storeId} (Socket: ${client.id})`);
    } else {
      console.log(`⚠️ Print Agent conectou sem store_id (Socket: ${client.id})`);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`🔌 Print Agent desconectado (Socket: ${client.id})`);
  }

  // Envia o pedido para a sala da loja específica
  emitNovoPedido(storeId: string | number, pedido: any) {
    const sala = `loja_${storeId}`;
    console.log(`📤 Enviando pedido #${pedido.id} para a sala: ${sala}`);
    this.server.to(sala).emit('novo_pedido_imprimir', pedido);
  }

  @SubscribeMessage('marcar_como_impresso')
  async handleMarcarComoImpresso(client: Socket, pedidoId: string) {
    try {
      await this.prisma.order.update({
        where: { id: pedidoId },
        data: { isPrinted: true },
      });
      console.log(`✅ Status isPrinted=true atualizado para o pedido #${pedidoId}`);
    } catch (error) {
      console.error(`❌ Erro ao atualizar isPrinted do pedido #${pedidoId}`, error.message);
    }
  }
}
