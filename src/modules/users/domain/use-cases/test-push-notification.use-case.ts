import { Injectable, BadRequestException } from '@nestjs/common';
import { IUsersRepository } from '../repositories/iusers.repository';
import { PushNotificationService } from '../../../../shared/services/push-notification.service';
import { UserNotFoundError } from '../exceptions/user-not-found.exception';

@Injectable()
export class TestPushNotificationUseCase {
  constructor(
    private readonly usersRepository: IUsersRepository,
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  async execute(userId: string): Promise<void> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    if (!user.expoPushToken) {
      throw new BadRequestException('User does not have an Expo Push Token registered.');
    }

    try {
      await this.pushNotificationService.sendNotifications(
        [user.expoPushToken],
        'Teste de Notificação 🚀',
        'Seu dispositivo está pronto para receber notificações de novos pedidos!'
      );
    } catch (err: any) {
      throw new BadRequestException(`Erro ao enviar push: ${err.message}`);
    }
  }
}
