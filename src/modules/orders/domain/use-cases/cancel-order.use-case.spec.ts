import { CancelOrderUseCase } from './cancel-order.use-case';
import { IOrdersRepository } from '../repositories/iorders.repository';
import { Order, OrderStatus } from '../entities/order.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('CancelOrderUseCase', () => {
  let cancelOrderUseCase: CancelOrderUseCase;
  let mockRepository: jest.Mocked<IOrdersRepository>;

  const mockOrderData = {
    id: 'uuid-order-1',
    orderNumber: 1001,
    customerName: 'Ana beatriz Martins',
    customerPhone: '(47) 98912-1987',
    itemsTotal: 160.00,
    freight: 15.00,
    discount: 8.00,
    totalOrder: 167.00,
    totalReceived: 167.00,
    paymentType: 'Online',
    paymentMethod: 'PIX',
    pixKey: '(67) 99213-0201',
    street: 'Avenida Mato Grosso',
    number: '3478',
    neighborhood: 'Santa Fé',
    city: 'Campo Grande',
    state: 'MS',
    cep: '79021-904',
    complement: 'diimagem',
    status: OrderStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
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

    cancelOrderUseCase = new CancelOrderUseCase(mockRepository);
  });

  it('should successfully cancel a pending order', async () => {
    const orderInstance = new Order({ ...mockOrderData, status: OrderStatus.PENDING });
    const cancelledInstance = new Order({ ...mockOrderData, status: OrderStatus.CANCELLED });
    mockRepository.findById.mockResolvedValue(orderInstance);
    mockRepository.cancelAndRestoreStock.mockResolvedValue(cancelledInstance);

    const result = await cancelOrderUseCase.execute('uuid-order-1');

    expect(result.status).toBe(OrderStatus.CANCELLED);
    expect(mockRepository.findById).toHaveBeenCalledWith('uuid-order-1');
    expect(mockRepository.cancelAndRestoreStock).toHaveBeenCalledWith('uuid-order-1');
  });

  it('should throw NotFoundException if order does not exist', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(cancelOrderUseCase.execute('invalid-id')).rejects.toThrow(NotFoundException);
    expect(mockRepository.findById).toHaveBeenCalledWith('invalid-id');
    expect(mockRepository.cancelAndRestoreStock).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException if cancelAndRestoreStock throws an error', async () => {
    const orderInstance = new Order({ ...mockOrderData, status: OrderStatus.COMPLETED });
    mockRepository.findById.mockResolvedValue(orderInstance);
    mockRepository.cancelAndRestoreStock.mockRejectedValue(new Error('Cannot cancel a completed order'));

    await expect(cancelOrderUseCase.execute('uuid-order-1')).rejects.toThrow(BadRequestException);
    expect(mockRepository.findById).toHaveBeenCalledWith('uuid-order-1');
    expect(mockRepository.cancelAndRestoreStock).toHaveBeenCalledWith('uuid-order-1');
  });
});
