import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IOrdersRepository } from '../repositories/iorders.repository';
import { Order, OrderStatus, PaymentStatus } from '../entities/order.entity';
import { ISettingsRepository } from '../../../settings/domain/repositories/isettings.repository';

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    private readonly ordersRepository: IOrdersRepository,
    private readonly settingsRepository: ISettingsRepository,
  ) {}

  async execute(id: string, payload: { status?: OrderStatus; paymentStatus?: PaymentStatus }): Promise<Order> {
    const order = await this.ordersRepository.findById(id);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    try {
      if (payload.status) {
        order.status = payload.status;
      }
      if (payload.paymentStatus) {
        order.paymentStatus = payload.paymentStatus;
        if (payload.paymentStatus === PaymentStatus.PAID) {
          order.paymentDate = new Date();
          
          if (!order.totalReceived || order.totalReceived === 0) {
            let initialDiscount = (order.couponDiscount || 0) + (order.couponFreightDiscount || 0);
            // Fix for FREE_SHIPPING coupons that might have 0 discount saved
            if (order.coupon && order.coupon.type === 'FREE_SHIPPING' && initialDiscount === 0) {
              initialDiscount = order.freight || 0;
              order.couponFreightDiscount = initialDiscount;
            }

            const baseTotal = (order.itemsTotal || 0) + (order.freight || 0);
            const totalDiscount = initialDiscount;
            const amountForFee = baseTotal - totalDiscount;
            const productDiscount = order.couponDiscount || 0;
            const baseForPix = Math.max(0, (order.itemsTotal || 0) - productDiscount);

            let pixDiscount = 0;
            let cardSurcharge = 0;
            let cardFee = 0;

            const methodMap: Record<string, string> = {
              'Cartão de Crédito': 'credit',
              'Cartão de Débito': 'debit',
              'PIX': 'pix',
              'Dinheiro': 'cash',
            };

            const normalizedMethod = methodMap[order.paymentMethod || ''];

            if (normalizedMethod) {
              const settings = await this.settingsRepository.get();
              if (settings && Array.isArray(settings.paymentRules)) {
                const rules = settings.paymentRules as any[];
                
                // PIX Discount
                if (normalizedMethod === 'pix') {
                  const pixRule = rules.find((r) => r.paymentMethod === 'pix' && r.type === 'discount');
                  if (pixRule && typeof pixRule.value === 'number') {
                    pixDiscount = Math.round((baseForPix * (pixRule.value / 100)) * 100) / 100;
                  }
                }
                
                // Card Surcharge (Passed to Customer)
                if (normalizedMethod === 'credit') {
                  const inst = order.installments || 1;
                  const surchargeRule = rules.find(
                    (r) => r.paymentMethod === 'credit' && r.type === 'charge' && inst >= (r.parcelaMin || 0) && inst <= (r.parcelaMax || 99)
                  );
                  if (surchargeRule && typeof surchargeRule.value === 'number' && surchargeRule.passedToCustomer !== false) {
                    cardSurcharge = Math.round((amountForFee * (surchargeRule.value / 100)) * 100) / 100;
                  }
                } else if (normalizedMethod === 'debit') {
                  const surchargeRule = rules.find((r) => r.paymentMethod === 'debit' && r.type === 'charge');
                  if (surchargeRule && typeof surchargeRule.value === 'number' && surchargeRule.passedToCustomer !== false) {
                    cardSurcharge = Math.round((amountForFee * (surchargeRule.value / 100)) * 100) / 100;
                  }
                }

                // Calculate Totals
                const calculatedTotal = Math.round((baseTotal + cardSurcharge + (order.receiptSurcharge || 0) - pixDiscount - totalDiscount) * 100) / 100;
                order.totalReceived = calculatedTotal;
                order.paymentDiscount = pixDiscount;
                order.installmentSurcharge = cardSurcharge;
                order.totalOrder = calculatedTotal;

                // Card Fee (Kept by Shop)
                let matchingRule: any = null;
                if (normalizedMethod === 'credit') {
                  const inst = order.installments || 1;
                  matchingRule = rules.find(
                    (r) => r.paymentMethod === 'credit' && r.type === 'charge' && inst >= (r.parcelaMin || 0) && inst <= (r.parcelaMax || 99)
                  );
                } else {
                  matchingRule = rules.find((r) => r.paymentMethod === normalizedMethod && r.type === 'charge');
                }

                if (matchingRule && typeof matchingRule.value === 'number') {
                  const rawFee = order.totalReceived * (matchingRule.value / 100);
                  cardFee = Math.round(rawFee * 100) / 100;
                }
              } else {
                order.totalReceived = Math.round((baseTotal + (order.receiptSurcharge || 0) - totalDiscount) * 100) / 100;
                order.totalOrder = order.totalReceived;
              }
            } else {
              order.totalReceived = Math.round((baseTotal + (order.receiptSurcharge || 0) - totalDiscount) * 100) / 100;
              order.totalOrder = order.totalReceived;
            }
            
            order.cardFee = cardFee;
          }

        } else if (payload.paymentStatus === PaymentStatus.PENDING) {
          order.paymentDate = null as any; // Prisma requires null or undefined based on schema
          order.totalReceived = 0;
          order.cardFee = 0;
        }
      }
      
      return await this.ordersRepository.save(order);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
