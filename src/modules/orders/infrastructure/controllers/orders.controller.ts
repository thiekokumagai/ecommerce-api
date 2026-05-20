import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { QueryOrdersDto } from '../dtos/query-orders.dto';
import { CreateOrderDto } from '../dtos/create-order.dto';
import { ListOrdersUseCase } from '../../domain/use-cases/list-orders.use-case';
import { GetOrderDetailUseCase } from '../../domain/use-cases/get-order-detail.use-case';
import { CancelOrderUseCase } from '../../domain/use-cases/cancel-order.use-case';
import { CreateOrderUseCase } from '../../domain/use-cases/create-order.use-case';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly listOrdersUseCase: ListOrdersUseCase,
    private readonly getOrderDetailUseCase: GetOrderDetailUseCase,
    private readonly cancelOrderUseCase: CancelOrderUseCase,
    private readonly createOrderUseCase: CreateOrderUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os pedidos com filtros' })
  @ApiResponse({
    status: 200,
    description: 'Lista de pedidos obtida com sucesso',
  })
  async list(@Query() query: QueryOrdersDto) {
    return this.listOrdersUseCase.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de um pedido por ID' })
  @ApiResponse({
    status: 200,
    description: 'Detalhes do pedido obtidos com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  async getDetail(@Param('id') id: string) {
    return this.getOrderDetailUseCase.execute(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar um novo pedido com verificação de estoque' })
  @ApiResponse({
    status: 201,
    description: 'Pedido criado com sucesso',
    type: CreateOrderDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Estoque insuficiente ou dados inválidos',
  })
  async create(@Body() body: CreateOrderDto) {
    return this.createOrderUseCase.execute(body as any);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar um pedido por ID' })
  @ApiResponse({ status: 200, description: 'Pedido cancelado com sucesso' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  async cancel(@Param('id') id: string) {
    return this.cancelOrderUseCase.execute(id);
  }
}
