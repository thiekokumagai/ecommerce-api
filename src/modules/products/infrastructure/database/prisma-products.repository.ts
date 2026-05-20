import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import {
  IProductsRepository,
  ProductWithDetails,
} from '../../domain/repositories/iproducts.repository';
import { Product, ProductImage } from '@prisma/client';

@Injectable()
export class PrismaProductsRepository implements IProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    title: string;
    description?: string | null;
    descriptionFormated?: string | null;
    categoryId: string;
    price?: any;
    promotionalPrice?: any;
    costPrice?: any;
  }): Promise<Product> {
    return this.prisma.product.create({
      data: {
        title: data.title,
        description: data.description,
        descriptionFormated: data.descriptionFormated,
        categoryId: data.categoryId,
        price: data.price,
        promotionalPrice: data.promotionalPrice,
        costPrice: data.costPrice,
      },
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string | null;
      descriptionFormated?: string | null;
      categoryId?: string;
      price?: any;
      promotionalPrice?: any;
      costPrice?: any;
    },
  ): Promise<Product> {
    return this.prisma.product.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        descriptionFormated: data.descriptionFormated,
        categoryId: data.categoryId,
        price: data.price,
        promotionalPrice: data.promotionalPrice,
        costPrice: data.costPrice,
      },
    });
  }

  async findAll(params: {
    skip: number;
    take: number;
    search?: string;
    categoryId?: string;
  }): Promise<ProductWithDetails[]> {
    const products = await this.prisma.product.findMany({
      skip: params.skip,
      take: params.take,
      where: {
        deletedAt: null,
        ...(params.search
          ? {
              title: {
                contains: params.search,
                mode: 'insensitive',
              },
            }
          : {}),
        ...(params.categoryId ? { categoryId: params.categoryId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        images: true,
      },
    });

    // To simulate findOne behavior in findAll, we need the heavy include
    return Promise.all(
      products.map(
        (product) => this.findById(product.id) as Promise<ProductWithDetails>,
      ),
    );
  }

  async checkCategoryExists(categoryId: string): Promise<boolean> {
    const cat = await this.prisma.category.findFirst({
      where: { id: categoryId, deletedAt: null },
      select: { id: true },
    });
    return !!cat;
  }

  async findById(id: string): Promise<ProductWithDetails | null> {
    return this.prisma.product.findFirst({
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
  }

  async addImages(productId: string, urls: string[]): Promise<void> {
    await this.prisma.productImage.createMany({
      data: urls.map((url) => ({
        url,
        productId,
      })),
    });
  }

  async findImageById(imageId: string): Promise<ProductImage | null> {
    return this.prisma.productImage.findUnique({
      where: { id: imageId },
    });
  }

  async removeImage(imageId: string): Promise<void> {
    await this.prisma.productImage.delete({
      where: { id: imageId },
    });
  }

  async findVariationsByIds(variationIds: string[]): Promise<{ id: string }[]> {
    return this.prisma.variation.findMany({
      where: {
        id: { in: variationIds },
        deletedAt: null,
      },
      select: { id: true },
    });
  }

  async findProductVariations(
    productId: string,
    variationIds: string[],
  ): Promise<{ variationId: string }[]> {
    return this.prisma.productVariation.findMany({
      where: {
        productId,
        variationId: { in: variationIds },
      },
      select: { variationId: true },
    });
  }

  async attachVariations(
    productId: string,
    variationIds: string[],
  ): Promise<void> {
    await this.prisma.productVariation.createMany({
      data: variationIds.map((variationId) => ({
        productId,
        variationId,
      })),
    });
  }

  async findItemsByProductId(productId: string): Promise<any[]> {
    return this.prisma.productItem.findMany({
      where: { productId },
      include: {
        options: {
          include: {
            option: true,
          },
        },
      },
    });
  }

  async replaceProductItemsTransaction(
    productId: string,
    variationStructureChanged: boolean,
    itemsToCreate: {
      stock: number;
      sku?: string | null;
      hash: string;
      optionIds: string[];
    }[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Remove item simples antigo, se existir
      await tx.productItem.deleteMany({
        where: {
          productId,
          hash: `simple_${productId}`,
        },
      });

      if (variationStructureChanged) {
        await tx.productItem.deleteMany({
          where: { productId },
        });
      }

      for (const item of itemsToCreate) {
        const createdItem = await tx.productItem.create({
          data: {
            productId,
            stock: item.stock,
            sku: item.sku,
            hash: item.hash,
          },
        });

        await tx.productItemOption.createMany({
          data: item.optionIds.map((optionId) => ({
            itemId: createdItem.id,
            optionId,
          })),
        });
      }
    });
  }

  async updateSimpleItemTransaction(
    productId: string,
    stock: number,
    sku?: string | null,
    hash?: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.productItem.deleteMany({
        where: { productId },
      });

      await tx.productItem.create({
        data: {
          productId,
          stock: stock,
          sku: sku,
          hash: hash || `simple_${productId}`,
        },
      });
    });
  }

  async listItems(productId: string): Promise<any[]> {
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

  async findItemById(itemId: string): Promise<{ id: string } | null> {
    return this.prisma.productItem.findUnique({
      where: { id: itemId },
      select: { id: true },
    });
  }

  async updateItemStock(itemId: string, stock: number): Promise<any> {
    return this.prisma.productItem.update({
      where: { id: itemId },
      data: { stock },
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

  async softDelete(id: string): Promise<string[]> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!product) return [];

    const imageUrls = product.images.map((img) => img.url);

    await this.prisma.product.delete({
      where: { id },
    });

    return imageUrls;
  }

  async deleteVariationTransaction(productId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Remove vínculos entre produto e variações
      await tx.productVariation.deleteMany({
        where: { productId },
      });

      // Remove vínculos das opções dos itens
      await tx.productItemOption.deleteMany({
        where: {
          item: { productId },
        },
      });

      // Remove todos os itens do produto
      await tx.productItem.deleteMany({
        where: { productId },
      });

      // Cria novamente um item simples vazio
      await tx.productItem.create({
        data: {
          productId,
          stock: 0,
          hash: `simple_${productId}`,
          sku: null,
        },
      });
    });
  }

  async deleteVariationOptionTransaction(
    productId: string,
    optionId: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 1. Remove a opção dos itens do produto
      await tx.productItemOption.deleteMany({
        where: {
          optionId: optionId,
          item: { productId },
        },
      });

      // 2. Busca itens atualizados
      const items = await tx.productItem.findMany({
        where: { productId },
        include: { options: true },
      });

      // 3. Remove itens sem opções
      const itemsToDelete = items.filter((item) => item.options.length === 0);

      if (itemsToDelete.length > 0) {
        await tx.productItem.deleteMany({
          where: {
            id: { in: itemsToDelete.map((i) => i.id) },
          },
        });
      }
    });
  }

  async duplicate(id: string): Promise<ProductWithDetails> {
    const original = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        images: true,
        variations: true,
        items: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!original) {
      throw new NotFoundException('Produto original não encontrado');
    }

    const duplicated = await this.prisma.$transaction(async (tx) => {
      const clone = await tx.product.create({
        data: {
          title: `${original.title} (Cópia)`,
          description: original.description,
          descriptionFormated: original.descriptionFormated,
          categoryId: original.categoryId,
          price: original.price,
          promotionalPrice: original.promotionalPrice,
          costPrice: original.costPrice,
        },
      });

      if (original.images.length > 0) {
        await tx.productImage.createMany({
          data: original.images.map((img) => ({
            url: img.url,
            productId: clone.id,
          })),
        });
      }

      if (original.variations.length > 0) {
        await tx.productVariation.createMany({
          data: original.variations.map((v) => ({
            productId: clone.id,
            variationId: v.variationId,
          })),
        });
      }

      const isSimple = original.variations.length === 0;

      if (isSimple) {
        await tx.productItem.create({
          data: {
            productId: clone.id,
            stock: 0,
            sku: original.items[0]?.sku ?? null,
            hash: `simple_${clone.id}`,
          },
        });
      } else {
        for (const item of original.items) {
          const duplicatedItem = await tx.productItem.create({
            data: {
              productId: clone.id,
              stock: 0,
              sku: item.sku ?? null,
              hash: item.hash,
            },
          });

          if (item.options.length > 0) {
            await tx.productItemOption.createMany({
              data: item.options.map((opt) => ({
                itemId: duplicatedItem.id,
                optionId: opt.optionId,
              })),
            });
          }
        }
      }

      return clone;
    });

    return this.findById(duplicated.id) as Promise<ProductWithDetails>;
  }
}
