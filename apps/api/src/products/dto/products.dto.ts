import {
  IsString, IsNumber, IsOptional, IsUUID, IsArray, IsBoolean,
  ValidateNested, Min, IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVariantDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color_hex?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  stock_quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  price_override?: number;
}

export class CreateProductImageDto {
  @ApiProperty()
  @IsString()
  url: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sort_order?: number;
}

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  mrp?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductImageDto)
  images?: CreateProductImageDto[];
}

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  mrp?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class ProductsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  city_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  sizes?: string | string[];

  @ApiPropertyOptional()
  @IsOptional()
  colors?: string | string[];

  @ApiPropertyOptional()
  @IsOptional()
  min_price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  max_price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  store_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  min_rating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  sort?: string;

  @ApiPropertyOptional()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  limit?: number;
}

export class AddVariantDto extends CreateVariantDto {
  @ApiProperty()
  @IsUUID()
  product_id: string;
}

export class UpdateStockDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  stock_quantity: number;
}
