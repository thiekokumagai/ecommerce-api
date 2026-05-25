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

      if (data.couponTitle) {
        const { coupon, discountAmount } = await this.validateCouponUseCase.execute({
          title: data.couponTitle,
          orderTotal: Number(data.itemsTotal) || 0,
        });

        couponId = coupon.id;
        finalDiscount = discountAmount;
      }

      const order = new Order({
        ...data,
        discount: finalDiscount,
        couponId: couponId,
        status: data.status || undefined,
      });

      // Recalcular o totalOrder para garantir a precisão no backend
      order.totalOrder = Math.round(
        (order.itemsTotal + order.freight + (order.surcharge || 0) + (order.cardSurcharge || 0) - order.discount - (order.pixDiscount || 0)) * 100
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
