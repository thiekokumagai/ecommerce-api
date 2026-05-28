/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import { Injectable, Logger } from '@nestjs/common';
import { VendizapService } from '../../infrastructure/services/vendizap.service';
import { ImageMigrationService } from '../../infrastructure/services/image-migration.service';
import { PrismaService } from '../../../../../prisma/prisma.service';

@Injectable()
export class ImportProductsUseCase {
  private readonly logger = new Logger(ImportProductsUseCase.name);

  constructor(
    private readonly vendizapService: VendizapService,
    private readonly imageMigrationService: ImageMigrationService,
    private readonly prisma: PrismaService,
  ) {}

  async execute() {
    this.logger.log('Starting products import from Vendizap');
    const data = await this.vendizapService.getProducts();
    console.log(data);
    // First ensure we have a default category if items don't map well
    let defaultCategory = await this.prisma.category.findFirst();
    if (!defaultCategory) {
      defaultCategory = await this.prisma.category.create({
        data: { title: 'Importados', externalId: 'DEFAULT' },
      });
    }

    const products = Array.isArray(data) ? data : data.data || [];
    for (const item of products) {
      try {
        // Find mapping category
        let categoryId = defaultCategory.id;
        // The API might use `categorias_old` (array of category names) or we might map to default if none.
        if (item.categorias_old && item.categorias_old.length > 0) {
          const categoryName = item.categorias_old[0];
          const mappedCat = await this.prisma.category.findFirst({
            where: { title: categoryName },
          });
          if (mappedCat) categoryId = mappedCat.id;
        } else if (item.category_id) {
          const mappedCat = await this.prisma.category.findUnique({
            where: { externalId: item.category_id.toString() },
          });
          if (mappedCat) categoryId = mappedCat.id;
        }

        const product = await this.prisma.product.upsert({
          where: { externalId: item.id.toString() },
          update: {
            title: item.descricao || item.title || item.name || 'Sem Título',
            categoryId: categoryId,
            price: item.preco || item.price || 0,
            description: item.detalhesFormatado || item.description || '',
          },
          create: {
            externalId: item.id.toString(),
            title: item.descricao || item.title || item.name || 'Sem Título',
            categoryId: categoryId,
            price: item.preco || item.price || 0,
            description: item.detalhesFormatado || item.description || '',
          },
        });

        // Upsert images
        let imagesToMigrate: any[] = [];
        if (item.foto) imagesToMigrate.push(item.foto);
        if (item.images && item.images.length > 0) {
          imagesToMigrate = item.images.map((img: any) => img.url || img);
        }

        if (imagesToMigrate.length > 0) {
          for (const img of imagesToMigrate) {
            const migratedUrl = await this.imageMigrationService.migrateImage(
              img,
              'products',
            );
            if (migratedUrl) {
              await this.prisma.productImage.create({
                data: {
                  url: migratedUrl,
                  productId: product.id,
                },
              });
            }
          }
        }
      } catch (error) {
        this.logger.error(`Failed to import product ${item.id}`, error);
      }
    }

    this.logger.log('Finished products import');
  }
}
