import { Injectable } from '@nestjs/common';
import { IUsersRepository } from '../repositories/iusers.repository';
import { UserNotFoundError } from '../exceptions/user-not-found.exception';

@Injectable()
export class UpdatePushTokenUseCase {
  constructor(private readonly usersRepository: IUsersRepository) {}

  async execute(userId: string, expoPushToken: string): Promise<void> {
    const user = await this.usersRepository.findById(userId);
    
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    await this.usersRepository.update(userId, { expoPushToken });
  }
}
