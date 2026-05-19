import { Module } from '@nestjs/common';
import { OrdersController } from './infrastructure/controllers/orders.controller';
import { IOrdersRepository } from './domain/repositories/iorders.repository';
import { PrismaOrdersRepository } from './infrastructure/database/prisma-orders.repository';

import { ListOrdersUseCase } from './domain/use-cases/list-orders.use-case';
import { GetOrderDetailUseCase } from './domain/use-cases/get-order-detail.use-case';
import { CancelOrderUseCase } from './domain/use-cases/cancel-order.use-case';
import { CreateOrderUseCase } from './domain/use-cases/create-order.use-case';

@Module({
  controllers: [OrdersController],
  providers: [
    ListOrdersUseCase,
    GetOrderDetailUseCase,
    CancelOrderUseCase,
    CreateOrderUseCase,
    {
      provide: IOrdersRepository,
      useClass: PrismaOrdersRepository,
    },
  ],
  exports: [IOrdersRepository],
})
export class OrdersModule {}
