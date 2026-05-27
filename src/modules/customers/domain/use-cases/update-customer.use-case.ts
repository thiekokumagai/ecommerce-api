import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ICustomersRepository } from '../repositories/icustomers.repository';
import { Customer } from '../entities/customer.entity';

@Injectable()
export class UpdateCustomerUseCase {
  constructor(
    @Inject('ICustomersRepository')
    private readonly customersRepository: ICustomersRepository,
  ) {}

  async execute(id: string, data: Partial<Customer>): Promise<Customer> {
    const customer = await this.customersRepository.findById(id);
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
    return this.customersRepository.update(id, data);
  }
}
