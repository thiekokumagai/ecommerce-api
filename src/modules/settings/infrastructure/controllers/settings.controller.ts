import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import sharp from 'sharp';

import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { MinioService } from '../../../../minio/minio.service';
import { UploadedFile as UploadedFileType } from '../../../../common/types/uploaded-file.type';

import { UpdateSettingsDto } from '../dtos/update-settings.dto';
import { GetSettingsUseCase } from '../../domain/use-cases/get-settings.use-case';
import { UpdateSettingsUseCase } from '../../domain/use-cases/update-settings.use-case';

@ApiTags('Settings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(
    private readonly getSettingsUseCase: GetSettingsUseCase,
    private readonly updateSettingsUseCase: UpdateSettingsUseCase,
    private readonly minioService: MinioService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obter configurações da loja' })
  @ApiResponse({ status: 200 })
  async get() {
    return this.getSettingsUseCase.execute();
  }

  @Put()
  @ApiOperation({ summary: 'Atualizar configurações da loja' })
  @ApiResponse({ status: 200 })
  async update(@Body() dto: UpdateSettingsDto) {
    return this.updateSettingsUseCase.execute(dto);
  }

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Fazer upload de mídia de configurações' })
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('Arquivo não enviado');
    }

    let buffer = file.buffer;
    if (file.mimetype.startsWith('image/')) {
      buffer = await sharp(file.buffer).webp({ quality: 90 }).toBuffer();
    }

    const upload = await this.minioService.uploadFile(
      {
        ...file,
        originalname: 'settings-media.webp',
        buffer,
        mimetype: 'image/webp',
      } as UploadedFileType,
      'settings',
    );

    return {
      url: upload.fileName,
      fileName: upload.fileName,
    };
  }
}
