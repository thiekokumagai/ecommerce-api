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
      include: { addresses: true },
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
}
