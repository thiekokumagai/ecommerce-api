import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IOrdersRepository } from '../repositories/iorders.repository';
import { Order, OrderStatus } from '../entities/order.entity';

@Injectable()
export class RevertReceiveOrderUseCase {
  constructor(private readonly ordersRepository: IOrdersRepository) {}

  async execute(id: string): Promise<Order> {
    const order = await this.ordersRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.COMPLETED) {
      throw new BadRequestException('Can only revert payment for a completed order');
    }

    order.status = OrderStatus.CONFIRMED;
    order.discount = 0;
    order.surcharge = 0;
    order.totalReceived = 0;
    order.totalOrder = order.itemsTotal + order.freight; // Recalculate original total

    return this.ordersRepository.save(order);
  }
}
