import { Injectable, NotFoundException } from '@nestjs/common';
import { IProductsRepository } from '../repositories/iproducts.repository';

@Injectable()
export class UpdateProductItemStockUseCase {
  constructor(private readonly productsRepository: IProductsRepository) {}

  async execute(itemId: string, dto: { stock: number }) {
    const item = await this.productsRepository.findItemById(itemId);
    if (!item) {
      throw new NotFoundException('Item do produto não encontrado');
    }

    return this.productsRepository.updateItemStock(itemId, dto.stock);
  }
}
