import { Order, OrderStatus } from '../entities/order.entity';

export interface OrderFilters {
  search?: string;
  status?: OrderStatus;
}

export abstract class IOrdersRepository {
  abstract findMany(filters: OrderFilters): Promise<Order[]>;
  abstract findById(id: string): Promise<Order | null>;
  abstract updateStatus(id: string, status: OrderStatus): Promise<void>;
  abstract save(order: Order): Promise<Order>;
  abstract saveWithStockDecrement(order: Order): Promise<Order>;
  abstract cancelAndRestoreStock(id: string): Promise<Order>;
}
