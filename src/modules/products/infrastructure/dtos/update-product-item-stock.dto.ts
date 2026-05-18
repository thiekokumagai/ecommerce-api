import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateProductItemStockDto {
  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(0)
  stock: number;
}
