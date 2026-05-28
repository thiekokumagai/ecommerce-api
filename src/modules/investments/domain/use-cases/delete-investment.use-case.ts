import { Injectable } from '@nestjs/common';
import { IInvestmentsRepository } from '../repositories/iinvestments.repository';

@Injectable()
export class DeleteInvestmentUseCase {
  constructor(private readonly investmentsRepository: IInvestmentsRepository) {}

  async execute(id: string): Promise<void> {
    await this.investmentsRepository.delete(id);
  }
}
