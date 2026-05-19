import { Injectable } from '@nestjs/common';
import { IOrdersRepository, OrderFilters } from '../repositories/iorders.repository';
import { Order } from '../entities/order.entity';

@Injectable()
export class ListOrdersUseCase {
  constructor(private readonly ordersRepository: IOrdersRepository) {}

  async execute(filters: OrderFilters): Promise<Order[]> {
    return this.ordersRepository.findMany(filters);
  }
}
