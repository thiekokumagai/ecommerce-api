import { ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Get, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { ListCustomersUseCase } from '../../domain/use-cases/list-customers.use-case';
import { GetCustomerUseCase } from '../../domain/use-cases/get-customer.use-case';
import { UpdateCustomerUseCase } from '../../domain/use-cases/update-customer.use-case';
import { UpdateCustomerDto } from '../dtos/update-customer.dto';

@Controller('customers')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(
    private readonly listCustomersUseCase: ListCustomersUseCase,
    private readonly getCustomerUseCase: GetCustomerUseCase,
    private readonly updateCustomerUseCase: UpdateCustomerUseCase,
  ) {}

  @Get()
  async list(@Query() filters: any) {
    return this.listCustomersUseCase.execute(filters);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.getCustomerUseCase.execute(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateCustomerDto) {
    return this.updateCustomerUseCase.execute(id, data);
  }
}
