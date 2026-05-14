import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsDto } from './dto/list-products.dto';
import { AttachProductVariationsDto } from './dto/attach-product-variations.dto';
import { CreateProductItemsDto } from './dto/create-product-items.dto';
import { UpdateProductItemStockDto } from './dto/update-product-item-stock.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateProductDto) {
    await this.ensureCategoryExists(dto.categoryId);

    const product = await this.prisma.product.create({
      data: {
        title: dto.title.trim(),
        description: dto.description,
        descriptionFormated: dto.descriptionFormated,
        categoryId: dto.categoryId,
        price: dto.price,
        promotionalPrice: dto.promotionalPrice,
        costPrice: dto.costPrice,
      },
    });

    return this.findOne(product.id);
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id); // Garante que o produto existe

    if (dto.categoryId) {
      await this.ensureCategoryExists(dto.categoryId);
    }

    await this.prisma.product.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        description: dto.description,
        descriptionFormated: dto.descriptionFormated,
        categoryId: dto.categoryId,
        price: dto.price,
        promotionalPrice: dto.promotionalPrice,
        costPrice: dto.costPrice,
      },
    });

    return this.findOne(id);
  }

  async findAll(query: ListProductsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const products = await this.prisma.product.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: {
        deletedAt: null,
        ...(query.search
          ? {
            title: {
              contains: query.search,
              mode: 'insensitive',
            },
          }
          : {}),
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        images: true,
      },
    });

    return Promise.all(products.map((product) => this.findOne(product.id)));
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        images: true,
        variations: {
          include: {
            variation: {
              include: {
                options: {
                  orderBy: { value: 'asc' },
                },
              },
            },
          },
        },
        items: {
          include: {
            options: {
              include: {
                option: {
                  include: {
                    variation: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    return product;
  }

  async addImages(productId: string, urls: string[]) {
    await this.findOne(productId);

    await this.prisma.productImage.createMany({
      data: urls.map((url) => ({
        url,
        productId,
      })),
    });

    return this.findOne(productId);
  }

  async removeImage(productId: string, imageId: string) {
    const product = await this.findOne(productId);

    const image = product.images.find((img) => img.id === imageId);
    if (!image) {
      throw new NotFoundException('Imagem não encontrada');
    }

    await this.prisma.productImage.delete({
      where: { id: imageId },
    });

    return image;
  }

  async attachVariations(productId: string, dto: AttachProductVariationsDto) {
    await this.findOne(productId);

    const uniqueVariationIds = [...new Set(dto.variationIds)];

    const variations = await this.prisma.variation.findMany({
      where: {
        id: { in: uniqueVariationIds },
        deletedAt: null,
      },
      select: { id: true },
    });

    if (variations.length !== uniqueVariationIds.length) {
      throw new BadRequestException('Uma ou mais variações são inválidas');
    }

    const existing = await this.prisma.productVariation.findMany({
      where: {
        productId,
        variationId: { in: uniqueVariationIds },
      },
      select: { variationId: true },
    });

    if (existing.length > 0) {
      throw new ConflictException(
        'Não pode existir duplicação de variação dentro do mesmo produto',
      );
    }

    await this.prisma.productVariation.createMany({
      data: uniqueVariationIds.map((variationId) => ({
        productId,
        variationId,
      })),
    });

    return this.findOne(productId);
  }

  async createItems(productId: string, dto: CreateProductItemsDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
      include: {
        variations: {
          include: { variation: { include: { options: true } } },
        },
      },
    });

    if (!product) throw new NotFoundException('Produto não encontrado');

    const isSimple = product.variations.length === 0;

    // --- PRODUTO SIMPLES ---
    if (isSimple) {
      if (dto.items.length > 1)
        throw new BadRequestException('Produto simples só pode ter um item');

      const item = dto.items[0];

      if (item.options && item.options.length > 0)
        throw new BadRequestException(
          'Produto simples não aceita opções de variação',
        );

      const hash = `simple_${productId}`;

      const existing = await this.prisma.productItem.findFirst({
        where: { productId, hash },
      });
      if (existing)
        throw new ConflictException('Item já cadastrado para este produto');

      await this.prisma.productItem.create({
        data: {
          productId,
          stock: item.stock,
          sku: item.sku,
          hash,
        },
      });

      return this.listItems(productId);
    }

    // --- PRODUTO COM VARIAÇÕES (sem alteração) ---
    const allowedOptionsMap = new Map<string, string>();
    const variationIdsByOptionId = new Map<string, string>();

    for (const productVariation of product.variations) {
      for (const option of productVariation.variation.options) {
        allowedOptionsMap.set(option.id, option.id);
        variationIdsByOptionId.set(option.id, option.variationId);
      }
    }

    const hashes = new Set<string>();

    for (const item of dto.items) {
      const optionIds = (item.options ?? [])
        .map((o: any) => (typeof o === 'string' ? o : o.optionId))
        .sort();

      if (optionIds.length === 0)
        throw new BadRequestException(
          'Item com variação precisa ter ao menos uma opção',
        );

      const hash = this.generateHash(optionIds);

      if (hashes.has(hash))
        throw new ConflictException(
          'Não pode existir duplicação de combinação de item (SKU)',
        );

      hashes.add(hash);

      for (const optionId of optionIds) {
        if (!allowedOptionsMap.has(optionId))
          throw new BadRequestException('Variação inválida para este produto');
      }

      const variationIds = optionIds.map((optionId) => {
        const variationId = variationIdsByOptionId.get(optionId);
        if (!variationId)
          throw new BadRequestException('Variação inválida para este produto');
        return variationId;
      });

      if (new Set(variationIds).size !== optionIds.length)
        throw new BadRequestException(
          'Cada item deve possuir no máximo uma opção por variação',
        );
    }

    const existingItems = await this.prisma.productItem.findMany({
      where: { productId, hash: { in: [...hashes] } },
      select: { hash: true },
    });

    if (existingItems.length > 0)
      throw new ConflictException('Item já existente para esta combinação');

    await this.prisma.$transaction(async (tx) => {
      for (const item of dto.items) {
        const optionIds = (item.options ?? [])
          .map((o: any) => (typeof o === 'string' ? o : o.optionId))
          .sort();
        const createdItem = await tx.productItem.create({
          data: {
            productId,
            stock: item.stock,
            sku: item.sku,
            hash: this.generateHash(optionIds),
          },
        });

        await tx.productItemOption.createMany({
          data: optionIds.map((optionId) => ({
            itemId: createdItem.id,
            optionId,
          })),
        });
      }
    });

    return this.listItems(productId);
  }

  async listItems(productId: string) {
    await this.findOne(productId);

    return this.prisma.productItem.findMany({
      where: { productId },
      include: {
        options: {
          include: {
            option: {
              include: {
                variation: true,
              },
            },
          },
        },
      },
    });
  }

  async updateItemStock(itemId: string, dto: UpdateProductItemStockDto) {
    const item = await this.prisma.productItem.findUnique({
      where: { id: itemId },
      select: { id: true },
    });

    if (!item) {
      throw new NotFoundException('Item do produto não encontrado');
    }

    return this.prisma.productItem.update({
      where: { id: itemId },
      data: { stock: dto.stock },
      include: {
        options: {
          include: {
            option: {
              include: {
                variation: true,
              },
            },
          },
        },
      },
    });
  }

  private async ensureCategoryExists(categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, deletedAt: null },
      select: { id: true },
    });

    if (!category) {
      throw new BadRequestException('Categoria inválida');
    }
  }

  private generateHash(optionIds: string[]) {
    return createHash('sha256').update(optionIds.join('|')).digest('hex');
  }

  async delete(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }
    const imageUrls = product.images.map((img) => img.url);
    await this.prisma.product.delete({
      where: { id },
    });

    return imageUrls;
  }
}
