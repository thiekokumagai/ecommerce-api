import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { MinioService } from '../../../../minio/minio.service';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class ImageMigrationService {
  private readonly logger = new Logger(ImageMigrationService.name);

  constructor(private readonly minioService: MinioService) {}

  async migrateImage(imageUrl: string): Promise<string | null> {
    if (!imageUrl) return null;

    try {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'binary');
      
      const result = await this.minioService.uploadFile({
        buffer,
        size: buffer.length,
        mimetype: response.headers['content-type'] || 'image/jpeg'
      } as any, 'vendizap-imports');

      return `https://${process.env.MINIO_ENDPOINT}/podemaismidia/${result.fileName}`;
    } catch (error) {
      this.logger.error(`Error migrating image ${imageUrl}`, error.message);
      return imageUrl; // Fallback to original url
    }
  }
}
