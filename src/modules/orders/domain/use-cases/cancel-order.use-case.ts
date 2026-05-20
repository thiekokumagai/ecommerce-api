import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IOrdersRepository } from '../repositories/iorders.repository';
import { Order } from '../entities/order.entity';

@Injectable()
export class CancelOrderUseCase {
  constructor(private readonly ordersRepository: IOrdersRepository) {}

  async execute(id: string): Promise<Order> {
    const order = await this.ordersRepository.findById(id);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    try {
      return await this.ordersRepository.cancelAndRestoreStock(id);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
