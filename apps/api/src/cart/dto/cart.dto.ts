import { IsUUID, IsNumber, IsPositive, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddCartItemDto {
  @ApiProperty()
  @IsUUID()
  variant_id: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  @Max(20)
  quantity: number;
}

export class UpdateCartItemDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Max(20)
  quantity: number;
}
