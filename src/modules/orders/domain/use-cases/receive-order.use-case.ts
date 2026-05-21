import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IOrdersRepository } from '../repositories/iorders.repository';
import { Order, OrderStatus } from '../entities/order.entity';

@Injectable()
export class ReceiveOrderUseCase {
  constructor(private readonly ordersRepository: IOrdersRepository) {}

  async execute(id: string, payload: {
    paymentMethod?: string;
    discount?: number;
    surcharge?: number;
    totalReceived: number;
  }): Promise<Order> {
    const order = await this.ordersRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot receive payment for a cancelled order');
    }

    if (payload.paymentMethod) order.paymentMethod = payload.paymentMethod;
    if (payload.discount !== undefined) order.discount = payload.discount;
    if (payload.surcharge !== undefined) order.surcharge = payload.surcharge;
    
    order.totalReceived = payload.totalReceived;

    // Recalculate totalOrder based on itemsTotal, freight, discount and surcharge
    order.totalOrder = order.itemsTotal + order.freight + order.surcharge - order.discount;

    // Optional: Auto mark as completed/confirmed if received full amount?
    // Here we just mark as COMPLETED for simplicity since it says "Confirmar Recebimento"
    if (order.status === OrderStatus.PENDING || order.status === OrderStatus.CONFIRMED) {
      order.status = OrderStatus.COMPLETED;
    }

    return this.ordersRepository.save(order);
  }
}
