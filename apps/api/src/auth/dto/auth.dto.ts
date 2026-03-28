import { IsString, IsPhoneNumber, Length, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ example: '+919876543210' })
  @IsString()
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+919876543210' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  otp: string;

  @IsOptional()
  @IsUUID()
  city_id?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  fcm_token?: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refresh_token: string;
}

export class LogoutDto {
  @IsOptional()
  @IsString()
  fcm_token?: string;
}
