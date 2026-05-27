import { Module } from '@nestjs/common';
import { CustomersController } from './infrastructure/controllers/customers.controller';
import { PrismaCustomersRepository } from './infrastructure/database/prisma-customers.repository';
import { ListCustomersUseCase } from './domain/use-cases/list-customers.use-case';
import { GetCustomerUseCase } from './domain/use-cases/get-customer.use-case';
import { UpdateCustomerUseCase } from './domain/use-cases/update-customer.use-case';

@Module({
  controllers: [CustomersController],
  providers: [
    ListCustomersUseCase,
    GetCustomerUseCase,
    UpdateCustomerUseCase,
    {
      provide: 'ICustomersRepository',
      useClass: PrismaCustomersRepository,
    },
  ],
  exports: ['ICustomersRepository'],
})
export class CustomersModule {}
