import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IOrdersRepository } from '../repositories/iorders.repository';
import { Order, OrderStatus, PaymentStatus } from '../entities/order.entity';
import { ISettingsRepository } from '../../../settings/domain/repositories/isettings.repository';

@Injectable()
export class ReceiveOrderUseCase {
  constructor(
    private readonly ordersRepository: IOrdersRepository,
    private readonly settingsRepository: ISettingsRepository,
  ) {}

  async execute(id: string, payload: {
    paymentMethod?: string;
    paymentType?: string;
    discount?: number;
    pixDiscount?: number;
    surcharge?: number;
    cardSurcharge?: number;
    totalReceived: number;
    installments?: number;
  }): Promise<Order> {
    const order = await this.ordersRepository.findById(id);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot receive a cancelled order');
    }

    order.paymentMethod = payload.paymentMethod || order.paymentMethod;
    if (payload.paymentType) {
      order.paymentType = payload.paymentType;
    }
    order.discount = payload.discount || 0;
    order.pixDiscount = payload.pixDiscount || 0;
    order.surcharge = payload.surcharge || 0;
    order.cardSurcharge = payload.cardSurcharge || 0;
    order.totalReceived = payload.totalReceived;
    order.totalOrder = Math.round((order.itemsTotal + order.freight + order.surcharge + order.cardSurcharge - order.discount - order.pixDiscount) * 100) / 100;
    order.paymentStatus = PaymentStatus.PAID;
    order.paymentDate = new Date();
    
    if (payload.installments) {
      order.installments = payload.installments;
    } else {
      order.installments = 1;
    }

    // Cálculo dinâmico da taxa de transação (cardFee) baseada nas regras ativas
    let cardFee = 0;
    const methodMap: Record<string, string> = {
      'Cartão de Crédito': 'credit',
      'Cartão de Débito': 'debit',
      'PIX': 'pix',
      'Dinheiro': 'cash',
    };

    const normalizedMethod = methodMap[order.paymentMethod];
    if (normalizedMethod) {
      const settings = await this.settingsRepository.get();
      if (settings && Array.isArray(settings.paymentRules)) {
        const rules = settings.paymentRules as any[];
        
        let matchingRule: any = null;
        if (normalizedMethod === 'credit') {
          // Para crédito, busca por parcelaMin e parcelaMax
          const inst = order.installments || 1;
          matchingRule = rules.find(
            (r) =>
              r.paymentMethod === 'credit' &&
              r.type === 'charge' &&
              inst >= (r.parcelaMin || 0) &&
              inst <= (r.parcelaMax || 99),
          );
        } else {
          // Outros métodos de pagamento
          matchingRule = rules.find(
            (r) => r.paymentMethod === normalizedMethod && r.type === 'charge',
          );
        }

        if (matchingRule && typeof matchingRule.value === 'number') {
          const rawFee = order.totalReceived * (matchingRule.value / 100);
          cardFee = Math.round(rawFee * 100) / 100;
        }
      }
    }

    order.cardFee = cardFee;

    return await this.ordersRepository.save(order);
  }
}
