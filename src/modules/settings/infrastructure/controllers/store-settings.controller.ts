import { Controller, Get, Post, Body } from '@nestjs/common';
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

  @Post('calculate-freight')
  @ApiOperation({ summary: 'Calcular frete para a vitrine' })
  async calculateFreight(@Body() body: { destination: string }) {
    // Retornando valor de mock para o frete, já que o supabase foi removido
    return {
      distanceKm: 5,
      freightPrice: 15,
    };
  }
}
