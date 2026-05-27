import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { Customer, CustomerAddress } from '../../domain/entities/customer.entity';
import { ICustomersRepository, CustomerFilters, PaginatedCustomers } from '../../domain/repositories/icustomers.repository';

@Injectable()
export class PrismaCustomersRepository implements ICustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToDomain(record: any): Customer {
    return new Customer({
      id: record.id,
      name: record.name,
      phone: record.phone,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      addresses: record.addresses?.map((addr: any) => new CustomerAddress(addr)) || [],
      orders: record.orders || [],
    });
  }

  async findMany(filters: CustomerFilters): Promise<PaginatedCustomers> {
    const where: any = {};
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    const page = filters.page ? Math.max(1, Number(filters.page)) : 1;
    const limit = filters.limit ? Math.max(1, Number(filters.limit)) : 10;
    const skip = (page - 1) * limit;

    const total = await this.prisma.customer.count({ where });
    const records = await this.prisma.customer.findMany({
      where,
      include: { addresses: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return {
      data: records.map((record: any) => this.mapToDomain(record)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<Customer | null> {
    const record = await this.prisma.customer.findUnique({
      where: { id },
      include: { 
        addresses: true,
        orders: {
          orderBy: { createdAt: 'desc' }
        }
      },
    });
    if (!record) return null;
    return this.mapToDomain(record);
  }

  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    const record = await this.prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
      },
      include: { addresses: true },
    });
    return this.mapToDomain(record);
  }

  async addAddress(id: string, address: any): Promise<Customer> {
    // Verifica se já existe um endereço com o mesmo CEP e número para não duplicar
    const existingAddress = await this.prisma.customerAddress.findFirst({
      where: {
        customerId: id,
        cep: address.cep,
        number: address.number,
      },
    });

    // Sempre remove o default dos outros endereços
    await this.prisma.customerAddress.updateMany({
      where: { customerId: id },
      data: { isDefault: false },
    });

    if (existingAddress) {
      // Se existir, apenas atualiza para ser o padrão
      await this.prisma.customerAddress.update({
        where: { id: existingAddress.id },
        data: { isDefault: true },
      });
    } else {
      // Se não existir, cria o novo como padrão
      await this.prisma.customerAddress.create({
        data: {
          customerId: id,
          street: address.street,
          number: address.number,
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
          cep: address.cep,
          complement: address.complement,
          isDefault: true, // Sempre o novo cadastrado será o padrão
        },
      });
    }

    const record = await this.prisma.customer.findUnique({
      where: { id },
      include: { 
        addresses: true,
        orders: { orderBy: { createdAt: 'desc' } }
      },
    });

    if (!record) throw new Error('Customer not found');
    return this.mapToDomain(record);
  }
}
