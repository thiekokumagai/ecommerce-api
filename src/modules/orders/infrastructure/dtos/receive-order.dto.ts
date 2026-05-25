import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReceiveOrderDto {
  @ApiProperty({ example: 'PIX', required: false })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiProperty({ example: 10.5, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiProperty({ example: 'Online', required: false })
  @IsString()
  @IsOptional()
  paymentType?: string;

  @ApiProperty({ example: 5.0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  pixDiscount?: number;

  @ApiProperty({ example: 5.0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  surcharge?: number;

  @ApiProperty({ example: 3.5, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  cardSurcharge?: number;

  @ApiProperty({ example: 150.0, required: true })
  @IsNumber()
  @Min(0)
  totalReceived: number;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  installments?: number;

  @ApiProperty({ example: 4.5, required: false })
  @IsNumber()
  @IsOptional()
  cardFee?: number;
}
