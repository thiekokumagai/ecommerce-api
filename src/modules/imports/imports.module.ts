import { Module } from '@nestjs/common';
import { MinioModule } from '../../minio/minio.module';
import { VendizapImportsController } from './infrastructure/controllers/vendizap-imports.controller';
import { VendizapService } from './infrastructure/services/vendizap.service';
import { ImageMigrationService } from './infrastructure/services/image-migration.service';
import { ImportCategoriesUseCase } from './domain/use-cases/import-categories.use-case';
import { ImportProductsUseCase } from './domain/use-cases/import-products.use-case';
import { ImportOrdersUseCase } from './domain/use-cases/import-orders.use-case';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  imports: [MinioModule],
  controllers: [VendizapImportsController],
  providers: [
    PrismaService,
    VendizapService,
    ImageMigrationService,
    ImportCategoriesUseCase,
    ImportProductsUseCase,
    ImportOrdersUseCase,
  ],
})
export class ImportsModule {}
