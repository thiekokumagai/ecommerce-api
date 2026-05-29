import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { MinioService } from '../../../../minio/minio.service';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

@Injectable()
export class ImageMigrationService {
  private readonly logger = new Logger(ImageMigrationService.name);

  constructor(private readonly minioService: MinioService) {}

  async migrateImage(
    imageUrl: string,
    folder: string = 'vendizap-imports',
  ): Promise<string | null> {
    if (!imageUrl) return null;

    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
      });
      const originalBuffer = Buffer.from(response.data, 'binary');

      const uuid = uuidv4();

      // Process main image (800x800 webp)
      const mainBuffer = await sharp(originalBuffer)
        .resize(800, 800, { fit: 'cover', position: 'center' })
        .webp({ quality: 90 })
        .toBuffer();

      const mainUpload = await this.minioService.uploadFile(
        {
          customName: `${uuid}.webp`,
          buffer: mainBuffer,
          size: mainBuffer.length,
          mimetype: 'image/webp',
        } as any,
        folder,
      );

      // Process thumbnail image (450x450 webp)
      const thumbBuffer = await sharp(originalBuffer)
        .resize(450, 450, { fit: 'cover', position: 'center' })
        .webp({ quality: 90 })
        .toBuffer();

      await this.minioService.uploadFile(
        {
          customName: `${uuid}-thumb.webp`,
          buffer: thumbBuffer,
          size: thumbBuffer.length,
          mimetype: 'image/webp',
        } as any,
        folder,
      );

      return mainUpload.fileName;
    } catch (error) {
      this.logger.error(`Error migrating image ${imageUrl}`, error.message);
      return imageUrl; // Fallback to original url
    }
  }
}
