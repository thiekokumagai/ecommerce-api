import { Injectable, Logger } from '@nestjs/common';
import { VendizapService } from '../../infrastructure/services/vendizap.service';
import { ImageMigrationService } from '../../infrastructure/services/image-migration.service';
import { PrismaService } from '../../../../../prisma/prisma.service';

@Injectable()
export class ImportProductImagesUseCase {
  private readonly logger = new Logger(ImportProductImagesUseCase.name);

  constructor(
    private readonly vendizapService: VendizapService,
    private readonly imageMigrationService: ImageMigrationService,
    private readonly prisma: PrismaService,
  ) {}

  async execute() {
    this.logger.log('Starting product images import from Vendizap');

    // Get all products that have an externalId (imported from Vendizap)
    const products = await this.prisma.product.findMany({
      where: { externalId: { not: null } },
      select: { id: true, externalId: true },
    });

    this.logger.log(`Found ${products.length} products to fetch images for`);

    for (const product of products) {
      if (!product.externalId) continue;

      try {
        // Fetch product details to get the "imagens" array
        const vendizapProduct = await this.vendizapService.getProductById(product.externalId);
        const images = vendizapProduct.imagens || vendizapProduct.images || [];

        if (images && images.length > 0) {
          for (const img of images) {
            // "img" is just the URL string according to the user's snippet
            const imgUrl = typeof img === 'string' ? img : img.url;
            if (!imgUrl) continue;

            const migratedUrl = await this.imageMigrationService.migrateImage(imgUrl, 'products');

            if (migratedUrl) {
              // Check if image already exists for this product
              const existing = await this.prisma.productImage.findFirst({
                where: { url: migratedUrl, productId: product.id },
              });

              if (!existing) {
                await this.prisma.productImage.create({
                  data: {
                    url: migratedUrl,
                    productId: product.id,
                  },
                });
              }
            }
          }
          this.logger.log(`Imported ${images.length} images for product ${product.externalId}`);
        }
      } catch (error) {
        this.logger.error(`Failed to import images for product ${product.externalId}`, error.message);
      }
    }

    this.logger.log('Finished product images import');
  }
}
