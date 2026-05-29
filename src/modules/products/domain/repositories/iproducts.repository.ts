import { Product, ProductImage, ProductItem } from '@prisma/client';

export type ProductWithDetails = Product & {
  category?: any;
  images?: any;
  variations?: any;
  items?: any;
};

export abstract class IProductsRepository {
  abstract create(data: {
    title: string;
    description?: string | null;
    descriptionFormated?: string | null;
    categoryId: string;
    price?: any;
    promotionalPrice?: any;
    costPrice?: any;
  }): Promise<Product>;

  abstract update(
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
  ): Promise<Product>;

  abstract findAll(params: {
    skip: number;
    take: number;
    search?: string;
    categoryId?: string;
  }): Promise<ProductWithDetails[]>;

  abstract count(params: {
    search?: string;
    categoryId?: string;
  }): Promise<number>;

  abstract findById(id: string): Promise<ProductWithDetails | null>;

  abstract checkCategoryExists(categoryId: string): Promise<boolean>;

  abstract addImages(productId: string, urls: string[]): Promise<void>;

  abstract findImageById(imageId: string): Promise<ProductImage | null>;

  abstract removeImage(imageId: string): Promise<void>;

  abstract findVariationsByIds(
    variationIds: string[],
  ): Promise<{ id: string }[]>;

  abstract findProductVariations(
    productId: string,
    variationIds: string[],
  ): Promise<{ variationId: string }[]>;

  abstract attachVariations(
    productId: string,
    variationIds: string[],
  ): Promise<void>;

  abstract findItemsByProductId(productId: string): Promise<any[]>;

  abstract replaceProductItemsTransaction(
    productId: string,
    variationStructureChanged: boolean,
    itemsToCreate: {
      stock: number;
      sku?: string | null;
      hash: string;
      optionIds: string[];
    }[],
  ): Promise<void>;

  abstract updateSimpleItemTransaction(
    productId: string,
    stock: number,
    sku?: string | null,
    hash?: string,
  ): Promise<void>;

  abstract listItems(productId: string): Promise<any[]>;

  abstract findItemById(itemId: string): Promise<{ id: string } | null>;

  abstract updateItemStock(itemId: string, stock: number): Promise<any>;

  abstract softDelete(id: string): Promise<string[]>; // Returns imageUrls

  abstract deleteVariationTransaction(productId: string): Promise<void>;

  abstract deleteVariationOptionTransaction(
    productId: string,
    optionId: string,
  ): Promise<void>;

  abstract duplicate(id: string): Promise<ProductWithDetails>;
}
