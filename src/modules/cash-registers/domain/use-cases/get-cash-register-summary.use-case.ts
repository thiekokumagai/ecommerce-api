import { Injectable, NotFoundException } from '@nestjs/common';
import { ICashRegistersRepository } from '../repositories/icash-registers.repository';
import { IOrdersRepository } from '../../../orders/domain/repositories/iorders.repository';
import { PrismaService } from '../../../../../prisma/prisma.service';

@Injectable()
export class GetCashRegisterSummaryUseCase {
  constructor(
    private readonly cashRegistersRepo: ICashRegistersRepository,
    private readonly ordersRepo: IOrdersRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(id: string): Promise<any> {
    const register = await this.cashRegistersRepo.findById(id);
    if (!register) {
      throw new NotFoundException(`CashRegister with ID ${id} not found`);
    }

    const startOfDay = new Date(register.startDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(register.endDate);
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await this.ordersRepo.findPaidOrdersByPaymentDateRange(
      startOfDay,
      endOfDay,
    );

    const transactions = await this.prisma.cashTransaction.findMany({
      where: { cashRegisterId: id },
      orderBy: { date: 'desc' },
    });

    let totalReceived = 0;
    let totalCardFees = 0;
    const totalsByMethod: Record<string, number> = {};

    for (const order of orders) {
      totalReceived += order.totalReceived;
      totalCardFees += order.cardFee || 0;
      const method = order.paymentMethod || 'Outros';
      totalsByMethod[method] =
        (totalsByMethod[method] || 0) + order.totalReceived;
    }

    let totalEntries = 0;
    let totalOutflows = 0;
    let motoboyOutflows = 0;
    let totalInvestment = 0;

    for (const tx of transactions) {
      if (tx.type === 'ENTRY') {
        totalEntries += Number(tx.amount);
      } else if (tx.type === 'OUTFLOW') {
        const isInvestment = tx.category === 'INVESTMENT' || (tx.description && tx.description.toLowerCase().includes('investimento'));
        if (isInvestment) {
          totalInvestment += Number(tx.amount);
        } else {
          totalOutflows += Number(tx.amount);
          if (tx.category === 'MOTOBOY') {
            motoboyOutflows += Number(tx.amount);
          }
        }
      }
    }

    // Faturamento bruto comercial das vendas + entradas manuais
    let totalGross = totalReceived + totalEntries;

    // Arredonda para evitar problemas matemáticos de ponto flutuante
    totalReceived = Math.round(totalReceived * 100) / 100;
    totalCardFees = Math.round(totalCardFees * 100) / 100;
    totalEntries = Math.round(totalEntries * 100) / 100;
    totalOutflows = Math.round(totalOutflows * 100) / 100;
    motoboyOutflows = Math.round(motoboyOutflows * 100) / 100;
    totalGross = Math.round(totalGross * 100) / 100;

    // Saldo Líquido de Caixa = Faturamento Comercial Bruto + Entradas Manuais - Taxas Cartão - Saídas/Custos Fixos - Investimentos
    const totalNet =
      Math.round((totalGross - totalCardFees - totalOutflows - totalInvestment) * 100) / 100;
    
    totalInvestment = Math.round(totalInvestment * 100) / 100;

    return {
      cashRegister: register,
      summary: {
        totalReceived, // Mantido para retrocompatibilidade
        totalGross,
        totalCardFees,
        totalEntries,
        totalOutflows,
        motoboyOutflows,
        totalNet,
        totalInvestment,
        totalsByMethod,
        orderCount: orders.length,
      },
      orders,
      transactions,
    };
  }
}
