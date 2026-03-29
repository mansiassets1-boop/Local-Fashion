import {
  IsString, IsOptional, IsNumber, IsUUID, IsBoolean, Min, Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OnboardSellerDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsNumber()
  lat: number;

  @ApiProperty()
  @IsNumber()
  lng: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gst_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bank_account?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bank_ifsc?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id_proof_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logo_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  banner_url?: string;
}

export class UpdateStoreDto {
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
  @IsString()
  address?: string;

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
  @IsString()
  logo_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  banner_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(30)
  return_policy_days?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(120)
  prep_time_mins?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gst_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bank_account?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bank_ifsc?: string;
}

export class StoreProductsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active_only?: boolean;
}
