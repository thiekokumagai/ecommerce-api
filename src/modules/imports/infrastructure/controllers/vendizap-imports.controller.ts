/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Post,
  Delete,
  Res,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { ImportCategoriesUseCase } from '../../domain/use-cases/import-categories.use-case';
import { ImportProductsUseCase } from '../../domain/use-cases/import-products.use-case';
import { ImportProductImagesUseCase } from '../../domain/use-cases/import-product-images.use-case';
import { ImportProductVariationsUseCase } from '../../domain/use-cases/import-product-variations.use-case';
import { ImportOrdersUseCase } from '../../domain/use-cases/import-orders.use-case';
import { ClearDatabaseUseCase } from '../../domain/use-cases/clear-database.use-case';

@ApiTags('Imports')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('imports/vendizap')
export class VendizapImportsController {
  constructor(
    private readonly importCategoriesUseCase: ImportCategoriesUseCase,
    private readonly importProductsUseCase: ImportProductsUseCase,
    private readonly importProductImagesUseCase: ImportProductImagesUseCase,
    private readonly importProductVariationsUseCase: ImportProductVariationsUseCase,
    private readonly importOrdersUseCase: ImportOrdersUseCase,
    private readonly clearDatabaseUseCase: ClearDatabaseUseCase,
  ) {}

  @Post('categories')
  async importCategories(@Res() res: Response) {
    try {
      await this.importCategoriesUseCase.execute();
      return res
        .status(HttpStatus.OK)
        .json({ message: 'Categorias importadas com sucesso' });
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @Post('products')
  async importProducts(@Res() res: Response) {
    try {
      await this.importProductsUseCase.execute();
      return res
        .status(HttpStatus.OK)
        .json({ message: 'Produtos importados com sucesso' });
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @Post('products/images')
  async importProductImages(@Res() res: Response) {
    try {
      await this.importProductImagesUseCase.execute();
      return res
        .status(HttpStatus.OK)
        .json({ message: 'Imagens de produtos importadas com sucesso' });
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @Post('products/variations')
  async importProductVariations(@Res() res: Response) {
    try {
      await this.importProductVariationsUseCase.execute();
      return res
        .status(HttpStatus.OK)
        .json({ message: 'Variações de produtos importadas com sucesso' });
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @Post('orders')
  async importOrders(@Res() res: Response) {
    try {
      await this.importOrdersUseCase.execute();
      return res
        .status(HttpStatus.OK)
        .json({ message: 'Pedidos importados com sucesso' });
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @Delete('clear')
  async clearDatabase(@Res() res: Response) {
    try {
      await this.clearDatabaseUseCase.execute();
      return res
        .status(HttpStatus.OK)
        .json({ message: 'Banco de dados limpo com sucesso' });
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
}
