import { Injectable, Logger } from '@nestjs/common';
import { VendizapService } from '../../infrastructure/services/vendizap.service';
import { ImageMigrationService } from '../../infrastructure/services/image-migration.service';
import { PrismaService } from '../../../../../prisma/prisma.service';

@Injectable()
export class ImportCategoriesUseCase {
  private readonly logger = new Logger(ImportCategoriesUseCase.name);

  constructor(
    private readonly vendizapService: VendizapService,
    private readonly imageMigrationService: ImageMigrationService,
    private readonly prisma: PrismaService,
  ) {}

  async execute() {
    this.logger.log('Starting categories import from Vendizap');
    const data = await this.vendizapService.getCategories();
    
    // Assuming data is an array of categories or has a data property
    const categories = Array.isArray(data) ? data : (data.data || []);
    for (const item of categories) {
      try {
        let imageUrl = item.image;
        if (imageUrl) {
          imageUrl = await this.imageMigrationService.migrateImage(imageUrl);
        }

        await this.prisma.category.upsert({
          where: { externalId: item.id.toString() },
          update: {
            title: item.title || item.name,
            image: imageUrl,
            isVisible: true,
          },
          create: {
            externalId: item.id.toString(),
            title: item.title || item.name,
            image: imageUrl,
            isVisible: true,
          }
        });
      } catch (error) {
        this.logger.error(`Failed to import category ${item.id}`, error);
      }
    }
    
    this.logger.log('Finished categories import');
  }
}
