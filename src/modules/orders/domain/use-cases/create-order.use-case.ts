import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { IOrdersRepository } from '../repositories/iorders.repository';
import { Order } from '../entities/order.entity';
import { ValidateCouponUseCase } from '../../../coupons/domain/use-cases/validate-coupon.use-case';
import type { ICouponsRepository } from '../../../coupons/domain/repositories/icoupons.repository';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    private readonly ordersRepository: IOrdersRepository,
    private readonly validateCouponUseCase: ValidateCouponUseCase,
    @Inject('ICouponsRepository')
    private readonly couponsRepository: ICouponsRepository,
  ) {}

  async execute(data: Partial<Order> & { couponTitle?: string }): Promise<Order> {
    try {
      let finalDiscount = Number(data.discount) || 0;
      let couponId: string | undefined = undefined;
      let couponDiscountValue = Number(data.couponDiscount) || 0;
      let couponFreightDiscountValue = Number(data.couponFreightDiscount) || 0;

      if (data.couponTitle) {
        const { coupon, discountAmount } = await this.validateCouponUseCase.execute({
          title: data.couponTitle,
          orderTotal: Number(data.itemsTotal) || 0,
        });

        couponId = coupon.id;
        if (coupon.type === 'FREE_SHIPPING') {
          couponFreightDiscountValue = Number(data.freight) || 0;
        } else {
          couponDiscountValue = discountAmount;
        }
      }

      const order = new Order({
        ...data,
        discount: finalDiscount,
        couponDiscount: couponDiscountValue,
        couponFreightDiscount: couponFreightDiscountValue,
        couponId: couponId,
        status: data.status || undefined,
      });

      // Recalcular o totalOrder para garantir a precisão no backend
      const itemsTotal = Number(order.itemsTotal) || 0;
      const freight = Number(order.freight) || 0;
      const installmentSurcharge = Number(order.installmentSurcharge) || 0;
      const receiptSurcharge = Number(order.receiptSurcharge) || 0;
      const paymentDiscount = Number(order.paymentDiscount) || 0;
      const receiptDiscount = Number(order.receiptDiscount) || 0;
      const cDiscount = Number(order.couponDiscount) || 0;
      const cFDiscount = Number(order.couponFreightDiscount) || 0;

      // Mantemos suporte aos campos legados se ainda chegarem
      const legacyCardSurcharge = Number(order.cardSurcharge) || 0;
      const legacySurcharge = Number(order.surcharge) || 0;
      const legacyPixDiscount = Number(order.pixDiscount) || 0;
      const legacyDiscount = Number(order.discount) || 0;

      order.totalOrder = Math.round(
        (itemsTotal + freight + installmentSurcharge + receiptSurcharge + legacyCardSurcharge + legacySurcharge
          - paymentDiscount - receiptDiscount - cDiscount - cFDiscount - legacyPixDiscount - legacyDiscount) * 100
      ) / 100;
      const savedOrder = await this.ordersRepository.saveWithStockDecrement(order);

      if (couponId) {
        const coupon = await this.couponsRepository.findById(couponId);
        if (coupon) {
          await this.couponsRepository.update(couponId, { currentUses: coupon.currentUses + 1 });
        }
      }

      return savedOrder;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
