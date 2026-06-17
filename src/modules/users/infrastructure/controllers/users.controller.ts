import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { CreateUserDto } from '../dtos/create-user.dto';
import { UserResponseDto } from '../dtos/user-response.dto';
import { DeleteUserDto } from '../dtos/delete-user.dto';

import { ListUsersUseCase } from '../../domain/use-cases/list-users.use-case';
import { CreateUserUseCase } from '../../domain/use-cases/create-user.use-case';
import { DeleteUserUseCase } from '../../domain/use-cases/delete-user.use-case';
import { UpdatePushTokenUseCase } from '../../domain/use-cases/update-push-token.use-case';
import { UpdatePushTokenDto } from '../dtos/update-push-token.dto';
import { CurrentUser } from '../../../../modules/auth/decorators/current-user.decorator';
import { JwtPayload } from '../../../../modules/auth/infrastructure/types/jwt-payload.type';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly updatePushTokenUseCase: UpdatePushTokenUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuários' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários',
    type: [UserResponseDto],
  })
  findAll() {
    return this.listUsersUseCase.execute();
  }

  @Post()
  @ApiOperation({ summary: 'Criar usuário' })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    type: UserResponseDto,
  })
  create(@Body() dto: CreateUserDto) {
    return this.createUserUseCase.execute(dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar usuário' })
  @ApiResponse({
    status: 200,
    description: 'Usuário removido',
  })
  delete(@Param() params: DeleteUserDto) {
    return this.deleteUserUseCase.execute(params.id);
  }

  @Post('push-token')
  @ApiOperation({ summary: 'Registrar Expo Push Token do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Token registrado com sucesso',
  })
  async registerPushToken(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdatePushTokenDto,
  ) {
    await this.updatePushTokenUseCase.execute(user.sub, dto.token);
    return { success: true };
  }
}
