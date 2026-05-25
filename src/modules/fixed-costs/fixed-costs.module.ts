import { Module } from '@nestjs/common';
import { FixedCostsController } from './infrastructure/controllers/fixed-costs.controller';
import { IFixedCostsRepository } from './domain/repositories/ifixed-costs.repository';
import { PrismaFixedCostsRepository } from './infrastructure/database/prisma-fixed-costs.repository';

import { CreateFixedCostUseCase } from './domain/use-cases/create-fixed-cost.use-case';
import { ListFixedCostsUseCase } from './domain/use-cases/list-fixed-costs.use-case';
import { UpdateFixedCostUseCase } from './domain/use-cases/update-fixed-cost.use-case';
import { DeleteFixedCostUseCase } from './domain/use-cases/delete-fixed-cost.use-case';
import { PayFixedCostUseCase } from './domain/use-cases/pay-fixed-cost.use-case';

@Module({
  controllers: [FixedCostsController],
  providers: [
    CreateFixedCostUseCase,
    ListFixedCostsUseCase,
    UpdateFixedCostUseCase,
    DeleteFixedCostUseCase,
    PayFixedCostUseCase,
    {
      provide: IFixedCostsRepository,
      useClass: PrismaFixedCostsRepository,
    },
  ],
  exports: [
    IFixedCostsRepository,
    CreateFixedCostUseCase,
    ListFixedCostsUseCase,
    UpdateFixedCostUseCase,
    DeleteFixedCostUseCase,
    PayFixedCostUseCase,
  ],
})
export class FixedCostsModule {}
