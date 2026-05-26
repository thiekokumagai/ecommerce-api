import { Injectable, BadRequestException } from "@nestjs/common";
import { IInvestmentsRepository } from "../repositories/iinvestments.repository";
import { ICashRegistersRepository } from "../../../cash-registers/domain/repositories/icash-registers.repository";
import { InvestmentTransaction } from "../entities/investment-transaction.entity";

interface ExecuteInput {
  amount: number;
  description?: string;
}

@Injectable()
export class AddInvestmentUseCase {
  constructor(
    private readonly investmentsRepository: IInvestmentsRepository,
    private readonly cashRegistersRepository: ICashRegistersRepository
  ) {}

  async execute({ amount, description }: ExecuteInput): Promise<InvestmentTransaction> {
    if (amount <= 0) {
      throw new BadRequestException("O valor do investimento deve ser maior que zero.");
    }

    const activeRegister = await this.cashRegistersRepository.findActive();
    if (!activeRegister) {
      throw new BadRequestException("Não há um caixa aberto. Abra um caixa para adicionar um investimento com dinheiro do caixa.");
    }

    // Cria a transação de sangria no caixa
    await this.cashRegistersRepository.addTransaction(activeRegister.id, {
      type: "OUTFLOW",
      amount,
      description: description || "Transferência para Módulo de Investimento",
    });

    // Cria a entrada no módulo de investimento
    return await this.investmentsRepository.create({
      type: "ENTRY",
      amount,
      description: description || "Transferência do Caixa Principal",
    });
  }
}
