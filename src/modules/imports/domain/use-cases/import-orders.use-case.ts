import { Injectable, Logger } from '@nestjs/common';
import { VendizapService } from '../../infrastructure/services/vendizap.service';
import { PrismaService } from '../../../../../prisma/prisma.service';

@Injectable()
export class ImportOrdersUseCase {
  private readonly logger = new Logger(ImportOrdersUseCase.name);

  constructor(
    private readonly vendizapService: VendizapService,
    private readonly prisma: PrismaService,
  ) {}

  async execute() {
    this.logger.log('Starting orders import from Vendizap');
    const data = await this.vendizapService.getOrders();
    
    for (const item of (data.data || [])) {
      try {
        // Customer upsert logic by phone
        const customerPhone = item.customer_phone || `NO-PHONE-${item.id}`;
        const customer = await this.prisma.customer.upsert({
          where: { phone: customerPhone },
          update: { name: item.customer_name || 'Imported Customer' },
          create: {
            phone: customerPhone,
            name: item.customer_name || 'Imported Customer'
          }
        });

        // Upsert order
        await this.prisma.order.upsert({
          where: { externalId: item.id.toString() },
          update: {
            status: 'COMPLETED',
          },
          create: {
            externalId: item.id.toString(),
            customerId: customer.id,
            customerName: customer.name,
            customerPhone: customer.phone,
            itemsTotal: item.subtotal || 0,
            freight: item.freight || 0,
            totalOrder: item.total || 0,
            totalReceived: item.total || 0,
            paymentType: item.payment_type || 'Online',
            paymentMethod: item.payment_method || 'PIX',
            street: item.street || '',
            number: item.number || '',
            neighborhood: item.neighborhood || '',
            city: item.city || '',
            state: item.state || '',
            cep: item.cep || '',
            status: 'COMPLETED',
            paymentStatus: 'PAID',
          }
        });
      } catch (error) {
        this.logger.error(`Failed to import order ${item.id}`, error);
      }
    }
    
    this.logger.log('Finished orders import');
  }
}
