import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../../domain/entities/order.entity';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
  @ApiProperty({ example: 'João da Silva', description: 'Nome do cliente' })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({
    example: '11999999999',
    description: 'Telefone de contato do cliente',
  })
  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @ApiProperty({ example: 150.0, description: 'Valor total dos itens' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  itemsTotal: number;

  @ApiProperty({ example: 15.0, description: 'Valor do frete' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  freight: number;

  @ApiProperty({ example: 10.0, description: 'Valor do desconto' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discount: number;

  @ApiProperty({
    example: 155.0,
    description: 'Valor total do pedido (itens + frete - desconto)',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalOrder: number;

  @ApiProperty({ example: 155.0, description: 'Valor total recebido' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalReceived: number;

  @ApiProperty({ example: 'Na Entrega', description: 'Tipo de pagamento' })
  @IsString()
  @IsNotEmpty()
  paymentType: string;

  @ApiProperty({ example: 'Dinheiro', description: 'Método de pagamento' })
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @ApiPropertyOptional({
    example: '11999999999',
    description: 'Chave PIX se o pagamento for PIX',
  })
  @IsString()
  @IsOptional()
  pixKey?: string;

  @ApiProperty({
    example: 'Rua das Flores',
    description: 'Endereço de entrega',
  })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ example: '123', description: 'Número do endereço de entrega' })
  @IsString()
  @IsNotEmpty()
  number: string;

  @ApiProperty({ example: 'Centro', description: 'Bairro de entrega' })
  @IsString()
  @IsNotEmpty()
  neighborhood: string;

  @ApiProperty({ example: 'São Paulo', description: 'Cidade de entrega' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'SP', description: 'Estado de entrega' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: '01001000', description: 'CEP de entrega' })
  @IsString()
  @IsNotEmpty()
  cep: string;

  @ApiPropertyOptional({
    example: 'Apto 42',
    description: 'Complemento do endereço de entrega',
  })
  @IsString()
  @IsOptional()
  complement?: string;

  @ApiPropertyOptional({
    example: OrderStatus.PENDING,
    enum: OrderStatus,
    description: 'Status inicial do pedido',
  })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiProperty({
    type: [CreateOrderItemDto],
    description: 'Itens inclusos no pedido',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
