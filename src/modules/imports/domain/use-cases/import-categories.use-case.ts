/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
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
    const categories = Array.isArray(data) ? data : data.data || [];
    let currentOrder = 1;
    for (const item of categories) {
      try {
        let imageUrl = item.imagem || item.image;
        if (imageUrl) {
          imageUrl = await this.imageMigrationService.migrateImage(imageUrl, 'categories');
        }

        await this.prisma.category.upsert({
          where: { externalId: item.id.toString() },
          update: {
            title: item.nome || item.title || item.name || 'Sem Título',
            image: imageUrl,
            isVisible: true,
            order: currentOrder,
          },
          create: {
            externalId: item.id.toString(),
            title: item.nome || item.title || item.name || 'Sem Título',
            image: imageUrl,
            isVisible: true,
            order: currentOrder,
          },
        });
        currentOrder++;
      } catch (error) {
        this.logger.error(`Failed to import category ${item.id}`, error);
      }
    }

    this.logger.log('Finished categories import');
  }
}
