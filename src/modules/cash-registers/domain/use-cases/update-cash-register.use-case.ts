import { Injectable, NotFoundException } from '@nestjs/common';
import { ICashRegistersRepository } from '../repositories/icash-registers.repository';
import { CashRegister } from '../entities/cash-register.entity';

@Injectable()
export class UpdateCashRegisterUseCase {
  constructor(private readonly repo: ICashRegistersRepository) {}

  async execute(id: string, data: Partial<CashRegister>): Promise<CashRegister> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundException(`CashRegister with ID ${id} not found`);
    }
    return await this.repo.update(id, data);
  }
}
