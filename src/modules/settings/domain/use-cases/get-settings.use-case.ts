import { Injectable } from '@nestjs/common';
import { StoreSettings } from '../entities/store-settings.entity';
import { ISettingsRepository } from '../repositories/isettings.repository';

@Injectable()
export class GetSettingsUseCase {
  constructor(private readonly settingsRepository: ISettingsRepository) {}

  async execute(): Promise<StoreSettings> {
    const settings = await this.settingsRepository.get();
    if (!settings) {
      return this.settingsRepository.save({
        storeName: 'Minha Loja',
        logoUrl: null,
        faviconUrl: null,
        topHeaderText: null,
        bannerUrls: [],
        phone: '',
        instagram: null,
        cep: '',
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        complement: null,
        hideAddress: false,
        deliveryOriginCep: null,
        deliveryOriginNumber: null,
        deliveryRanges: [],
        installmentRules: [],
        pixEnabled: false,
        pixKeyType: null,
        pixKey: null,
        pixHolder: null,
        payOnDeliveryCash: false,
        payOnDeliveryCardDebit: false,
        payOnDeliveryCardCredit: false,
        paymentRules: [],
      });
    }
    return settings;
  }
}
