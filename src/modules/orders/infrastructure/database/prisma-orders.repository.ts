import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import {
  Order,
  OrderStatus,
  OrderItem,
} from '../../domain/entities/order.entity';
import {
  IOrdersRepository,
  OrderFilters,
} from '../../domain/repositories/iorders.repository';

@Injectable()
export class PrismaOrdersRepository implements IOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToDomain(record: any): Order {
    return new Order({
      id: record.id,
      orderNumber: record.orderNumber,
      customerName: record.customerName,
      customerPhone: record.customerPhone,
      itemsTotal: Number(record.itemsTotal),
      freight: Number(record.freight),
      discount: Number(record.discount),
      surcharge: Number(record.surcharge),
      totalOrder: Number(record.totalOrder),
      totalReceived: Number(record.totalReceived),
      paymentType: record.paymentType,
      paymentMethod: record.paymentMethod,
      pixKey: record.pixKey,
      street: record.street,
      number: record.number,
      neighborhood: record.neighborhood,
      city: record.city,
      state: record.state,
      cep: record.cep,
      complement: record.complement,
      status: record.status as OrderStatus,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      items:
        record.items?.map((item: any) => {
          let imageUrl = undefined;
          if (item.product?.images?.length > 0) {
            const mainImage = item.product.images.find((img: any) => img.isMain) || item.product.images[0];
            imageUrl = mainImage.url;
          }
          return {
            id: item.id,
            orderId: item.orderId,
            productId: item.productId,
            productItemId: item.productItemId || null,
            productName: item.productName,
            price: Number(item.price),
            quantity: item.quantity,
            variation: item.variation || null,
            imageUrl,
          };
        }) ?? [],
    });
  }

  async findMany(filters: OrderFilters): Promise<Order[]> {
    const where: any = {};

    if (filters.search) {
      where.OR = [
        { id: { contains: filters.search, mode: 'insensitive' } },
        { customerName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    const records = await this.prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return records.map((record) => this.mapToDomain(record));
  }

  async findById(id: string): Promise<Order | null> {
    const record = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
      },
    });

    if (!record) return null;
    return this.mapToDomain(record);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<void> {
    await this.prisma.order.update({
      where: { id },
      data: { status },
    });
  }

  async save(order: Order): Promise<Order> {
    const payload = {
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      itemsTotal: order.itemsTotal,
      freight: order.freight,
      discount: order.discount,
      surcharge: order.surcharge,
      totalOrder: order.totalOrder,
      totalReceived: order.totalReceived,
      paymentType: order.paymentType,
      paymentMethod: order.paymentMethod,
      pixKey: order.pixKey,
      street: order.street,
      number: order.number,
      neighborhood: order.neighborhood,
      city: order.city,
      state: order.state,
      cep: order.cep,
      complement: order.complement,
      status: order.status,
    };

    let record;
    if (order.id) {
      record = await this.prisma.order.update({
        where: { id: order.id },
        data: payload,
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: true,
                },
              },
            },
          },
        },
      });
    } else {
      record = await this.prisma.order.create({
        data: {
          ...payload,
          items: {
            create:
              order.items?.map((item) => ({
                productId: item.productId,
                productItemId: item.productItemId,
                productName: item.productName,
                price: item.price,
                quantity: item.quantity,
                variation: item.variation,
              })) ?? [],
          },
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: true,
                },
              },
            },
          },
        },
      });
    }

    return this.mapToDomain(record);
  }

  async saveWithStockDecrement(order: Order): Promise<Order> {
    const record = await this.prisma.$transaction(async (tx) => {
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          if (!item.productId) {
            throw new Error(
              `Item productName ${item.productName} must be linked to a productId`,
            );
          }

          let productItem: any;
          if (item.productItemId) {
            productItem = await tx.productItem.findUnique({
              where: { id: item.productItemId },
            });
          } else {
            productItem = await tx.productItem.findFirst({
              where: { productId: item.productId },
            });
          }

          if (!productItem) {
            throw new Error(
              `Estoque do produto ou variação de "${item.productName}" não cadastrado.`,
            );
          }

          if (productItem.stock < item.quantity) {
            throw new Error(
              `Estoque insuficiente para o item "${item.productName}". Disponível: ${productItem.stock}, Solicitado: ${item.quantity}`,
            );
          }

          await tx.productItem.update({
            where: { id: productItem.id },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });

          item.productItemId = productItem.id;
        }
      }

      const payload = {
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        itemsTotal: order.itemsTotal,
        freight: order.freight,
        discount: order.discount,
        surcharge: order.surcharge,
        totalOrder: order.totalOrder,
        totalReceived: order.totalReceived,
        paymentType: order.paymentType,
        paymentMethod: order.paymentMethod,
        pixKey: order.pixKey,
        street: order.street,
        number: order.number,
        neighborhood: order.neighborhood,
        city: order.city,
        state: order.state,
        cep: order.cep,
        complement: order.complement,
        status: order.status,
      };

      const createdOrder = await tx.order.create({
        data: {
          ...payload,
          items: {
            create:
              order.items?.map((item) => ({
                productId: item.productId,
                productItemId: item.productItemId,
                productName: item.productName,
                price: item.price,
                quantity: item.quantity,
                variation: item.variation,
              })) ?? [],
          },
        },
        include: {
          items: true,
        },
      });

      return createdOrder;
    });

    return this.mapToDomain(record);
  }

  async cancelAndRestoreStock(id: string): Promise<Order> {
    const record = await this.prisma.$transaction(async (tx) => {
      const orderRecord = await tx.order.findUnique({
        where: { id },
        include: {
          items: true,
        },
      });

      if (!orderRecord) {
        throw new Error(`Order with ID ${id} not found`);
      }

      if (orderRecord.status === 'CANCELLED') {
        throw new Error('Order is already cancelled');
      }

      if (orderRecord.status === 'COMPLETED') {
        throw new Error('Cannot cancel a completed order');
      }

      for (const item of orderRecord.items) {
        if (item.productItemId) {
          await tx.productItem.update({
            where: { id: item.productItemId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: 'CANCELLED',
        },
        include: {
          items: true,
        },
      });

      return updatedOrder;
    });

    return this.mapToDomain(record);
  }
}
