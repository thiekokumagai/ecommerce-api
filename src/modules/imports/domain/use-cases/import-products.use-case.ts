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
    
    // First ensure we have a default category if items don't map well
    let defaultCategory = await this.prisma.category.findFirst();
    if (!defaultCategory) {
       defaultCategory = await this.prisma.category.create({ data: { title: 'Importados', externalId: 'DEFAULT' }});
    }

    for (const item of (data.data || [])) {
      try {
        // Find mapping category
        let categoryId = defaultCategory.id;
        if (item.category_id) {
           const mappedCat = await this.prisma.category.findUnique({ where: { externalId: item.category_id.toString() }});
           if (mappedCat) categoryId = mappedCat.id;
        }

        const product = await this.prisma.product.upsert({
          where: { externalId: item.id.toString() },
          update: {
            title: item.title || item.name,
            categoryId: categoryId,
            price: item.price || 0,
            description: item.description || '',
          },
          create: {
            externalId: item.id.toString(),
            title: item.title || item.name,
            categoryId: categoryId,
            price: item.price || 0,
            description: item.description || '',
          }
        });

        // Upsert images
        if (item.images && item.images.length > 0) {
            for (const img of item.images) {
                const migratedUrl = await this.imageMigrationService.migrateImage(img.url);
                if (migratedUrl) {
                    await this.prisma.productImage.create({
                        data: {
                            url: migratedUrl,
                            productId: product.id
                        }
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
