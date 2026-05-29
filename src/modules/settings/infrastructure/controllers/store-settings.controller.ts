import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetSettingsUseCase } from '../../domain/use-cases/get-settings.use-case';

@ApiTags('Store Settings')
@Controller('store/settings')
export class StoreSettingsController {
  constructor(private readonly getSettingsUseCase: GetSettingsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Obter configurações públicas da loja (vitrine)' })
  @ApiResponse({ status: 200 })
  async getStoreSettings() {
    return this.getSettingsUseCase.execute();
  }
}
