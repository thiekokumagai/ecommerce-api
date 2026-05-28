import { Controller, Post, Res, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { ImportCategoriesUseCase } from '../../domain/use-cases/import-categories.use-case';
import { ImportProductsUseCase } from '../../domain/use-cases/import-products.use-case';
import { ImportOrdersUseCase } from '../../domain/use-cases/import-orders.use-case';

@ApiTags('Imports')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('imports/vendizap')
export class VendizapImportsController {
  constructor(
    private readonly importCategoriesUseCase: ImportCategoriesUseCase,
    private readonly importProductsUseCase: ImportProductsUseCase,
    private readonly importOrdersUseCase: ImportOrdersUseCase,
  ) {}

  @Post('categories')
  async importCategories(@Res() res: Response) {
    try {
      await this.importCategoriesUseCase.execute();
      return res.status(HttpStatus.OK).json({ message: 'Categorias importadas com sucesso' });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  @Post('products')
  async importProducts(@Res() res: Response) {
    try {
      await this.importProductsUseCase.execute();
      return res.status(HttpStatus.OK).json({ message: 'Produtos importados com sucesso' });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  @Post('orders')
  async importOrders(@Res() res: Response) {
    try {
      await this.importOrdersUseCase.execute();
      return res.status(HttpStatus.OK).json({ message: 'Pedidos importados com sucesso' });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }
}
