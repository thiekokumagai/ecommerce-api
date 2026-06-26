import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { IOrdersRepository } from '../repositories/iorders.repository';
import { Order } from '../entities/order.entity';
import { ValidateCouponUseCase } from '../../../coupons/domain/use-cases/validate-coupon.use-case';
import type { ICouponsRepository } from '../../../coupons/domain/repositories/icoupons.repository';
import { PushNotificationService } from '../../../../shared/services/push-notification.service';
import { IUsersRepository } from '../../../users/domain/repositories/iusers.repository';
import { PrintGateway } from '../../../print/print.gateway';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    private readonly ordersRepository: IOrdersRepository,
    private readonly validateCouponUseCase: ValidateCouponUseCase,
    @Inject('ICouponsRepository')
    private readonly couponsRepository: ICouponsRepository,
    private readonly pushNotificationService: PushNotificationService,
    private readonly usersRepository: IUsersRepository,
    private readonly printGateway: PrintGateway,
  ) {}

  async execute(
    data: Partial<Order> & { couponTitle?: string },
  ): Promise<Order> {
    try {
      let couponId: string | undefined = undefined;
      let couponDiscountValue = Number(data.couponDiscount) || 0;
      let couponFreightDiscountValue = Number(data.couponFreightDiscount) || 0;

      if (data.couponTitle) {
        const { coupon, discountAmount } =
          await this.validateCouponUseCase.execute({
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
        couponDiscount: couponDiscountValue,
        couponFreightDiscount: couponFreightDiscountValue,
        couponId: couponId,
        status: data.status || undefined,
        paymentDate: data.paymentStatus === 'PAID' ? new Date() : undefined,
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
      const calculatedTotal =
        Math.round(
          (itemsTotal +
            freight +
            installmentSurcharge +
            receiptSurcharge -
            paymentDiscount -
            receiptDiscount -
            cDiscount -
            cFDiscount) *
            100,
        ) / 100;
        
      order.totalOrder = data.totalOrder !== undefined ? data.totalOrder : calculatedTotal;
      const savedOrder =
        await this.ordersRepository.saveWithStockDecrement(order);

      if (couponId) {
        const coupon = await this.couponsRepository.findById(couponId);
        if (coupon) {
          await this.couponsRepository.update(couponId, {
            currentUses: coupon.currentUses + 1,
          });
        }
      }

      // Disparar Notificação Push
      try {
        const admins = await this.usersRepository.findAll();
        const tokens = admins.map(u => u.expoPushToken).filter(Boolean) as string[];
        console.log(`[Push Notification] Found ${tokens.length} tokens to send notifications.`);
        if (tokens.length > 0) {
          this.pushNotificationService.sendNotifications(
            tokens,
            'Novo Pedido Recebido! 🛍️',
            `Pedido #${savedOrder.orderNumber} - R$ ${Number(savedOrder.totalOrder).toFixed(2).replace('.', ',')} de ${savedOrder.customerName}`,
            { orderId: savedOrder.id }
          ).catch(e => console.error(e));
        }
      } catch (err) {
        console.error('Erro ao buscar tokens para notificação', err);
      }

      // Disparar WebSocket para impressão
      try {
        // Envia para a loja 1 (ajuste se tiver multi-tenant)
        const orderForPrint = { ...savedOrder, showProductPrices: data.showProductPrices };
        this.printGateway.emitNovoPedido('1', orderForPrint);
      } catch (err) {
        console.error('Erro ao emitir pedido para impressão', err);
      }

      return savedOrder;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
