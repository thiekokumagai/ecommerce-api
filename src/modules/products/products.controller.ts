import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MinioService } from '../../minio/minio.service';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsDto } from './dto/list-products.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { AttachProductVariationsDto } from './dto/attach-product-variations.dto';
import { CreateProductItemsDto } from './dto/create-product-items.dto';
import { UpdateProductItemStockDto } from './dto/update-product-item-stock.dto';
import { UploadProductImagesDto } from './dto/upload-product-images.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadedFile as UploadedFileType } from '../../common/types/uploaded-file.type';

@ApiTags('Products')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(
    private service: ProductsService,
    private minioService: MinioService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar produtos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de produtos',
    type: [ProductResponseDto],
  })
  findAll(@Query() query: ListProductsDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar produto completo' })
  @ApiResponse({
    status: 200,
    description: 'Produto com categoria, imagens, variações e itens',
    type: ProductResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar produto' })
  @ApiResponse({
    status: 201,
    description: 'Produto criado com sucesso',
    type: ProductResponseDto,
  })
  create(@Body() dto: CreateProductDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar produto' })
  @ApiResponse({
    status: 200,
    description: 'Produto atualizado com sucesso',
    type: ProductResponseDto,
  })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/variations')
  @ApiOperation({ summary: 'Vincular variações ao produto' })
  attachVariations(
    @Param('id') id: string,
    @Body() dto: AttachProductVariationsDto,
  ) {
    return this.service.attachVariations(id, dto);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Criar itens do produto' })
  createItems(@Param('id') id: string, @Body() dto: CreateProductItemsDto) {
    return this.service.createItems(id, dto);
  }

  @Get(':id/items')
  @ApiOperation({ summary: 'Listar itens do produto' })
  listItems(@Param('id') id: string) {
    return this.service.listItems(id);
  }

  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Atualizar estoque do item do produto' })
  updateItemStock(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateProductItemStockDto,
  ) {
    return this.service.updateItemStock(itemId, dto);
  }

  @Post(':id/images')
  @UseInterceptors(FilesInterceptor('files'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadProductImagesDto })
  @ApiOperation({ summary: 'Fazer upload de imagens do produto' })
  async uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) return this.service.findOne(id);

    const urls: string[] = [];

    for (const file of files) {
      const uuid = randomUUID();

      const mainBuffer = await sharp(file.buffer)
        .resize(800, 800, { fit: 'cover', position: 'center' })
        .webp({ quality: 90 })
        .toBuffer();

      const mainUpload = await this.minioService.uploadFile(
        {
          ...file,
          customName: `${uuid}.webp`,
          buffer: mainBuffer,
          mimetype: 'image/webp',
        } as UploadedFileType,
        'products',
      );

      const thumbBuffer = await sharp(file.buffer)
        .resize(450, 450, { fit: 'cover', position: 'center' })
        .webp({ quality: 90 })
        .toBuffer();

      await this.minioService.uploadFile(
        {
          ...file,
          customName: `${uuid}-thumb.webp`,
          buffer: thumbBuffer,
          mimetype: 'image/webp',
        } as UploadedFileType,
        'products',
      );

      urls.push(mainUpload.fileName);
    }

    return this.service.addImages(id, urls);
  }

  @Delete(':id/images/:imageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover imagem do produto' })
  async removeImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ) {
    const image = await this.service.removeImage(id, imageId);
    if (image.url) {
      await this.minioService.deleteFile(image.url);

      const thumbUrl = image.url.replace('.webp', '-thumb.webp');
      await this.minioService.deleteFile(thumbUrl);
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    const imageUrls = await this.service.delete(id);

    await Promise.all(
      imageUrls.flatMap((url) => {
        const thumbUrl = url.replace('.webp', '-thumb.webp');

        return [
          this.minioService.deleteFile(url),
          this.minioService.deleteFile(thumbUrl),
        ];
      }),
    );
  }
}
