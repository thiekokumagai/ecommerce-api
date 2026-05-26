import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { CashRegistersModule } from "../cash-registers/cash-registers.module";
import { InvestmentsController } from "./infrastructure/controllers/investments.controller";
import { IInvestmentsRepository } from "./domain/repositories/iinvestments.repository";
import { PrismaInvestmentsRepository } from "./infrastructure/database/prisma-investments.repository";
import { AddInvestmentUseCase } from "./domain/use-cases/add-investment.use-case";
import { RegisterPurchaseUseCase } from "./domain/use-cases/register-purchase.use-case";
import { GetInvestmentSummaryUseCase } from "./domain/use-cases/get-investment-summary.use-case";
import { ListInvestmentTransactionsUseCase } from "./domain/use-cases/list-investment-transactions.use-case";

@Module({
  imports: [PrismaModule, CashRegistersModule],
  controllers: [InvestmentsController],
  providers: [
    {
      provide: IInvestmentsRepository,
      useClass: PrismaInvestmentsRepository,
    },
    AddInvestmentUseCase,
    RegisterPurchaseUseCase,
    GetInvestmentSummaryUseCase,
    ListInvestmentTransactionsUseCase,
  ],
  exports: [IInvestmentsRepository],
})
export class InvestmentsModule {}
