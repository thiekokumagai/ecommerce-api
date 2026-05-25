import { GetCashRegisterSummaryUseCase } from './get-cash-register-summary.use-case';
import { ICashRegistersRepository } from '../repositories/icash-registers.repository';
import { IOrdersRepository } from '../../../orders/domain/repositories/iorders.repository';
import { CashRegister } from '../entities/cash-register.entity';
import { Order } from '../../../orders/domain/entities/order.entity';
import { NotFoundException } from '@nestjs/common';

describe('GetCashRegisterSummaryUseCase', () => {
  let useCase: GetCashRegisterSummaryUseCase;
  let mockCashRepo: jest.Mocked<ICashRegistersRepository>;
  let mockOrdersRepo: jest.Mocked<IOrdersRepository>;

  const mockRegister = {
    id: 'register-1',
    title: 'Caixa de Teste',
    operatorId: 'operator-1',
    status: 'CLOSED' as any,
    openingBalance: 100,
    closingBalance: 250,
    startDate: new Date('2026-05-23T10:00:00Z'),
    endDate: new Date('2026-05-23T22:00:00Z'),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as CashRegister;

  const mockOrders = [
    new Order({
      id: 'order-1',
      totalReceived: 100,
      cardFee: 5,
      paymentMethod: 'Cartão de Crédito',
    }),
    new Order({
      id: 'order-2',
      totalReceived: 50,
      cardFee: 0,
      paymentMethod: 'PIX',
    }),
  ];

  beforeEach(() => {
    mockCashRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<ICashRegistersRepository>;

    mockOrdersRepo = {
      findPaidOrdersByPaymentDateRange: jest.fn(),
    } as unknown as jest.Mocked<IOrdersRepository>;

    useCase = new GetCashRegisterSummaryUseCase(mockCashRepo, mockOrdersRepo);
  });

  it('should throw NotFoundException if cash register does not exist', async () => {
    mockCashRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('invalid-id')).rejects.toThrow(NotFoundException);
  });

  it('should calculate gross, card fees, net, and totals by method', async () => {
    mockCashRepo.findById.mockResolvedValue(mockRegister);
    mockOrdersRepo.findPaidOrdersByPaymentDateRange.mockResolvedValue(mockOrders);

    const result = await useCase.execute('register-1');

    expect(result.cashRegister).toEqual(mockRegister);
    expect(result.summary).toEqual({
      totalReceived: 150,
      totalGross: 150,
      totalCardFees: 5,
      totalNet: 145,
      orderCount: 2,
      totalsByMethod: {
        'Cartão de Crédito': 100,
        'PIX': 50,
      },
    });

    expect(mockOrdersRepo.findPaidOrdersByPaymentDateRange).toHaveBeenCalledWith(
      mockRegister.startDate,
      mockRegister.endDate
    );
  });
});
