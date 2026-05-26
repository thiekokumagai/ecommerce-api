import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IOrdersRepository } from '../repositories/iorders.repository';
import { Order, PaymentStatus } from '../entities/order.entity';

@Injectable()
export class RevertReceiveOrderUseCase {
  constructor(private readonly ordersRepository: IOrdersRepository) {}

  async execute(id: string): Promise<Order> {
    const order = await this.ordersRepository.findById(id);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    order.paymentStatus = PaymentStatus.PENDING;
    order.paymentDate = null;
    order.totalReceived = 0;
    order.receiptSurcharge = 0;
    order.receiptDiscount = 0;
    order.paymentDiscount = 0;
    order.installmentSurcharge = 0;
    order.cardFee = 0;
    
    return await this.ordersRepository.save(order);
  }
}
