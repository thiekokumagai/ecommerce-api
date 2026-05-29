/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
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

  private formatDateForVendizap(date: Date) {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  async execute() {
    this.logger.log('Starting orders import from Vendizap (Month by Month)');

    let currentDate = new Date(2023, 0, 1); // Jan 1, 2023
    const now = new Date();

    while (currentDate <= now) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      const startOfMonth = new Date(year, month, 1, 0, 0, 0);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

      const periodEnd = endOfMonth > now ? now : endOfMonth;

      const dataInicial = this.formatDateForVendizap(startOfMonth);
      const dataFinal = this.formatDateForVendizap(periodEnd);

      this.logger.log(`Fetching orders from ${dataInicial} to ${dataFinal}`);

      let skip = 0;
      let hasMore = true;
      const limit = 50;

      while (hasMore) {
        try {
          const data = await this.vendizapService.getOrders({
            tipoData: 'criacao',
            dataInicial,
            dataFinal,
            cancelados: false,
            somenteNovos: false,
            skip,
            limit
          });

          const orders = Array.isArray(data) ? data : data.data || [];

          if (orders.length === 0) {
            hasMore = false;
            break;
          }

          for (const item of orders) {
            try {
              // 1. Customer upsert
              const customerPhone = item.customer_phone || item.telefone || `NO-PHONE-${item.id}`;
              const customerName = item.customer_name || item.nome || 'Imported Customer';
              
              const customer = await this.prisma.customer.upsert({
                where: { phone: customerPhone },
                update: { name: customerName },
                create: {
                  phone: customerPhone,
                  name: customerName,
                },
              });

              // 2. CustomerAddress upsert
              // Check if address data is present in order
              const addressData = item.costumer_adress || item.customer_address || {};
              const street = addressData.rua || addressData.street || item.street || item.rua || '';
              const number = addressData.numero || addressData.number || item.number || item.numero || '';
              const neighborhood = addressData.bairro || addressData.neighborhood || item.neighborhood || item.bairro || '';
              const city = addressData.cidade || addressData.city || item.city || item.cidade || '';
              const state = addressData.estado || addressData.state || item.state || item.estado || '';
              const cep = addressData.cep || item.cep || '';
              const complement = addressData.complemento || addressData.complement || item.complement || item.complemento || '';

              if (street) {
                // Try to find if customer already has this address
                let address = await this.prisma.customerAddress.findFirst({
                  where: { customerId: customer.id, street, number, cep }
                });

                if (!address) {
                  address = await this.prisma.customerAddress.create({
                    data: {
                      customerId: customer.id,
                      street,
                      number,
                      neighborhood,
                      city,
                      state,
                      cep,
                      complement,
                      isDefault: true
                    }
                  });
                }
              }

              // 3. Upsert order
              const dtString = item.dt_criacao || item.created_at ? (item.dt_criacao || item.created_at).replace(' ', 'T') : undefined;
              
              const order = await this.prisma.order.upsert({
                where: { externalId: item.id.toString() },
                update: {
                  status: 'COMPLETED',
                  itemsTotal: item.subtotal || 0,
                  freight: item.freight || item.frete || 0,
                  totalOrder: item.total || 0,
                  totalReceived: item.total || 0,
                  paymentType: item.payment_type || item.tipo_pagamento || 'Online',
                  paymentMethod: item.payment_method || item.forma_pagamento || 'PIX',
                  street,
                  number,
                  neighborhood,
                  city,
                  state,
                  cep,
                  complement
                },
                create: {
                  externalId: item.id.toString(),
                  customerId: customer.id,
                  customerName: customer.name,
                  customerPhone: customer.phone,
                  itemsTotal: item.subtotal || 0,
                  freight: item.freight || item.frete || 0,
                  totalOrder: item.total || 0,
                  totalReceived: item.total || 0,
                  paymentType: item.payment_type || item.tipo_pagamento || 'Online',
                  paymentMethod: item.payment_method || item.forma_pagamento || 'PIX',
                  street,
                  number,
                  neighborhood,
                  city,
                  state,
                  cep,
                  complement,
                  status: 'COMPLETED',
                  paymentStatus: 'PAID',
                  ...(dtString ? { createdAt: new Date(dtString) } : {}),
                },
              });

              // 4. Order Items
              const itensList = item.itens || item.items || [];
              if (itensList.length > 0) {
                // Clear existing items for this order if any to replace with updated list
                await this.prisma.orderItem.deleteMany({
                  where: { orderId: order.id }
                });

                for (const orderItem of itensList) {
                  const itemExternalId = orderItem.id_produto || orderItem.product_id;
                  let productId = null;

                  if (itemExternalId) {
                    const product = await this.prisma.product.findUnique({
                      where: { externalId: itemExternalId.toString() }
                    });
                    if (product) {
                      productId = product.id;
                    }
                  }

                  await this.prisma.orderItem.create({
                    data: {
                      orderId: order.id,
                      productId: productId,
                      productName: orderItem.nome || orderItem.name || 'Produto Importado',
                      price: orderItem.preco || orderItem.price || 0,
                      quantity: orderItem.quantidade || orderItem.quantity || 1,
                      variation: orderItem.variacao || orderItem.variation || null
                    }
                  });
                }
              }

            } catch (error) {
              this.logger.error(`Failed to process order ${item.id}`, error);
            }
          }

          skip += limit;
          if (orders.length < limit) {
            hasMore = false;
          }
        } catch (error) {
          this.logger.error(`Error fetching orders for period ${dataInicial} - ${dataFinal}`, error.message);
          hasMore = false;
        }
      }

      currentDate = new Date(year, month + 1, 1);
    }

    this.logger.log('Finished orders import');
  }
}
