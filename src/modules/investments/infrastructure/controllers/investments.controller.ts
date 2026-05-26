import { Controller, Post, Get, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/infrastructure/guards/jwt-auth.guard";
import { AddInvestmentUseCase } from "../../domain/use-cases/add-investment.use-case";
import { RegisterPurchaseUseCase } from "../../domain/use-cases/register-purchase.use-case";
import { GetInvestmentSummaryUseCase } from "../../domain/use-cases/get-investment-summary.use-case";
import { ListInvestmentTransactionsUseCase } from "../../domain/use-cases/list-investment-transactions.use-case";
import { AddInvestmentDto } from "./dtos/add-investment.dto";
import { RegisterPurchaseDto } from "./dtos/register-purchase.dto";

@ApiTags("investments")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("investments")
export class InvestmentsController {
  constructor(
    private readonly addInvestmentUseCase: AddInvestmentUseCase,
    private readonly registerPurchaseUseCase: RegisterPurchaseUseCase,
    private readonly getInvestmentSummaryUseCase: GetInvestmentSummaryUseCase,
    private readonly listInvestmentTransactionsUseCase: ListInvestmentTransactionsUseCase
  ) {}

  @Post("add")
  @ApiOperation({ summary: "Adiciona dinheiro ao módulo de investimento a partir do caixa atual" })
  async addInvestment(@Body() dto: AddInvestmentDto) {
    return await this.addInvestmentUseCase.execute(dto);
  }

  @Post("purchase")
  @ApiOperation({ summary: "Registra uma compra de mercadoria subtraindo do investimento" })
  async registerPurchase(@Body() dto: RegisterPurchaseDto) {
    return await this.registerPurchaseUseCase.execute(dto);
  }

  @Get("summary")
  @ApiOperation({ summary: "Retorna o resumo (saldo e totais) do módulo de investimento" })
  async getSummary() {
    return await this.getInvestmentSummaryUseCase.execute();
  }

  @Get("transactions")
  @ApiOperation({ summary: "Lista todo o histórico de transações de investimento" })
  async listTransactions() {
    return await this.listInvestmentTransactionsUseCase.execute();
  }
}
