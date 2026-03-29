import { IsNumber, IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLocationDto {
  @ApiProperty()
  @IsNumber()
  lat: number;

  @ApiProperty()
  @IsNumber()
  lng: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  order_id?: string;
}

export class ToggleAvailabilityDto {
  @ApiProperty()
  @IsBoolean()
  online: boolean;
}

export class VerifyDeliveryOtpDto {
  @ApiProperty()
  @IsUUID()
  order_id: string;

  @ApiProperty()
  @IsString()
  otp: string;
}

export class EarningsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  period?: 'today' | 'week' | 'month';
}
