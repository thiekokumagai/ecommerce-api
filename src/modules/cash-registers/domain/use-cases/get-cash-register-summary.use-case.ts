import { Injectable, NotFoundException } from '@nestjs/common';
import { ICashRegistersRepository } from '../repositories/icash-registers.repository';
import { IOrdersRepository } from '../../../orders/domain/repositories/iorders.repository';

@Injectable()
export class GetCashRegisterSummaryUseCase {
  constructor(
    private readonly cashRegistersRepo: ICashRegistersRepository,
    private readonly ordersRepo: IOrdersRepository,
  ) {}

  async execute(id: string): Promise<any> {
    const register = await this.cashRegistersRepo.findById(id);
    if (!register) {
      throw new NotFoundException(`CashRegister with ID ${id} not found`);
    }

    const orders = await this.ordersRepo.findPaidOrdersByPaymentDateRange(
      register.startDate,
      register.endDate,
    );

    let totalReceived = 0;
    let totalCardFees = 0;
    const totalsByMethod: Record<string, number> = {};

    for (const order of orders) {
      totalReceived += order.totalReceived;
      totalCardFees += order.cardFee || 0;
      const method = order.paymentMethod || 'Outros';
      totalsByMethod[method] = (totalsByMethod[method] || 0) + order.totalReceived;
    }

    // Arredonda para evitar problemas matemáticos de ponto flutuante
    totalReceived = Math.round(totalReceived * 100) / 100;
    totalCardFees = Math.round(totalCardFees * 100) / 100;
    const totalNet = Math.round((totalReceived - totalCardFees) * 100) / 100;

    return {
      cashRegister: register,
      summary: {
        totalReceived, // Mantido para retrocompatibilidade
        totalGross: totalReceived,
        totalCardFees,
        totalNet,
        totalsByMethod,
        orderCount: orders.length,
      },
      orders,
    };
  }
}
