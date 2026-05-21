import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IOrdersRepository } from '../repositories/iorders.repository';
import { Order, OrderStatus, PaymentStatus } from '../entities/order.entity';

@Injectable()
export class ReceiveOrderUseCase {
  constructor(private readonly ordersRepository: IOrdersRepository) {}

  async execute(id: string, payload: {
    paymentMethod?: string;
    discount?: number;
    surcharge?: number;
    totalReceived: number;
    installments?: number;
  }): Promise<Order> {
    const order = await this.ordersRepository.findById(id);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot receive a cancelled order');
    }

    order.paymentMethod = payload.paymentMethod || order.paymentMethod;
    order.discount = payload.discount || 0;
    // We do not have surcharge in db, maybe we can ignore it or log it
    order.totalReceived = payload.totalReceived;
    order.paymentStatus = PaymentStatus.PAID;
    
    if (payload.installments) {
      order.installments = payload.installments;
    }

    return await this.ordersRepository.save(order);
  }
}
