import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IOrdersRepository } from '../repositories/iorders.repository';
import { Order, OrderStatus, PaymentStatus } from '../entities/order.entity';

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(private readonly ordersRepository: IOrdersRepository) {}

  async execute(id: string, payload: { status?: OrderStatus; paymentStatus?: PaymentStatus }): Promise<Order> {
    const order = await this.ordersRepository.findById(id);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    try {
      if (payload.status) {
        order.status = payload.status;
      }
      if (payload.paymentStatus) {
        order.paymentStatus = payload.paymentStatus;
      }
      
      return await this.ordersRepository.save(order);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
