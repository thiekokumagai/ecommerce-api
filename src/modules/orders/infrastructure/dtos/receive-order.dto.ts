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

  @ApiProperty({ example: 5.0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  surcharge?: number;

  @ApiProperty({ example: 150.0, required: true })
  @IsNumber()
  @Min(0)
  totalReceived: number;
}
