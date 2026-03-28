import { IsString, IsNumber, IsBoolean, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCityDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  lat: number;

  @ApiProperty()
  @IsNumber()
  lng: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  delivery_radius_km?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  platform_fee_pct?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sla_accept_mins?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sla_ready_mins?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateCityDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  delivery_radius_km?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  platform_fee_pct?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sla_accept_mins?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sla_ready_mins?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class HomeQueryDto {
  @ApiProperty()
  city_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lng?: number;
}
