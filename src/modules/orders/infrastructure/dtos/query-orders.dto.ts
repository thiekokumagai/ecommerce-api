import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../../domain/entities/order.entity';

export class QueryOrdersDto {
  @ApiProperty({ example: 'Ana beatriz', required: false })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ example: 'PENDING', enum: OrderStatus, required: false })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  endDate?: string;
}
