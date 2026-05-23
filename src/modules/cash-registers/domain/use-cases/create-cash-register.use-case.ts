import { Injectable } from '@nestjs/common';
import { ICashRegistersRepository } from '../repositories/icash-registers.repository';
import { CashRegister } from '../entities/cash-register.entity';

@Injectable()
export class CreateCashRegisterUseCase {
  constructor(private readonly repo: ICashRegistersRepository) {}

  async execute(data: { title: string; startDate: Date; endDate: Date }): Promise<CashRegister> {
    return await this.repo.create(data);
  }
}
