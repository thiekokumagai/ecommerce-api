import { Module } from '@nestjs/common';
import { UsersController } from './infrastructure/controllers/users.controller';
import { PrismaUsersRepository } from './infrastructure/database/prisma-users.repository';
import { IUsersRepository } from './domain/repositories/iusers.repository';
import { ListUsersUseCase } from './domain/use-cases/list-users.use-case';
import { CreateUserUseCase } from './domain/use-cases/create-user.use-case';
import { DeleteUserUseCase } from './domain/use-cases/delete-user.use-case';

@Module({
  controllers: [UsersController],
  providers: [
    ListUsersUseCase,
    CreateUserUseCase,
    DeleteUserUseCase,
    {
      provide: IUsersRepository,
      useClass: PrismaUsersRepository,
    },
  ],
  exports: [IUsersRepository],
})
export class UsersModule {}
