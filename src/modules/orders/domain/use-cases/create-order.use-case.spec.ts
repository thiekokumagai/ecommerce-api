import { CreateOrderUseCase } from './create-order.use-case';
import { IOrdersRepository } from '../repositories/iorders.repository';
import { Order, OrderStatus } from '../entities/order.entity';
import { BadRequestException } from '@nestjs/common';

describe('CreateOrderUseCase', () => {
  let createOrderUseCase: CreateOrderUseCase;
  let mockRepository: jest.Mocked<IOrdersRepository>;

  const mockOrderInput = {
    customerName: 'João Silva',
    customerPhone: '(67) 99999-1234',
    itemsTotal: 100.0,
    freight: 10.0,
    discount: 0.0,
    totalOrder: 110.0,
    totalReceived: 0.0,
    paymentType: 'Online',
    paymentMethod: 'PIX',
    street: 'Rua Principal',
    number: '123',
    neighborhood: 'Centro',
    city: 'Campo Grande',
    state: 'MS',
    cep: '79000-000',
    items: [
      {
        productId: 'prod-1',
        productItemId: 'item-1',
        productName: 'Ignite V80',
        price: 100.0,
        quantity: 1,
        variation: 'Grape Ice',
        imageUrl: null,
      },
    ],
  };

  beforeEach(() => {
    mockRepository = {
      findMany: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
      save: jest.fn(),
      saveWithStockDecrement: jest.fn(),
      cancelAndRestoreStock: jest.fn(),
    } as unknown as jest.Mocked<IOrdersRepository>;

    createOrderUseCase = new CreateOrderUseCase(mockRepository);
  });

  it('should successfully create an order and call saveWithStockDecrement', async () => {
    const orderInstance = new Order({
      ...mockOrderInput,
      id: 'generated-uuid',
      status: OrderStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockRepository.saveWithStockDecrement.mockResolvedValue(orderInstance);

    const result = await createOrderUseCase.execute(mockOrderInput);

    expect(result.id).toBe('generated-uuid');
    expect(result.status).toBe(OrderStatus.PENDING);
    expect(mockRepository.saveWithStockDecrement).toHaveBeenCalled();
  });

  it('should throw BadRequestException if saveWithStockDecrement throws an error (e.g. stock insufficient)', async () => {
    mockRepository.saveWithStockDecrement.mockRejectedValue(new Error('Estoque insuficiente'));

    await expect(createOrderUseCase.execute(mockOrderInput)).rejects.toThrow(BadRequestException);
    expect(mockRepository.saveWithStockDecrement).toHaveBeenCalled();
  });
});
