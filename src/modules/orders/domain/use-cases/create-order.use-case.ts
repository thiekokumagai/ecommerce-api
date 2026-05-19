import { Injectable, BadRequestException } from '@nestjs/common';
import { IOrdersRepository } from '../repositories/iorders.repository';
import { Order } from '../entities/order.entity';

@Injectable()
export class CreateOrderUseCase {
  constructor(private readonly ordersRepository: IOrdersRepository) {}

  async execute(data: Partial<Order>): Promise<Order> {
    try {
      const order = new Order({
        ...data,
        status: data.status || undefined,
      });
      return await this.ordersRepository.saveWithStockDecrement(order);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
