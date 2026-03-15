import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: '+447700900123 or john@example.com' })
  @IsString()
  identifier: string; // Can be phone or email

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ example: 'device-uuid-here' })
  @IsString()
  @IsOptional()
  deviceId?: string;

  @ApiPropertyOptional({ example: 'fcm-token-here' })
  @IsString()
  @IsOptional()
  fcmToken?: string;
}

export class SendOtpDto {
  @ApiProperty({ example: '+447700900123 or john@example.com' })
  @IsString()
  identifier: string; // Phone or email
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+447700900123 or john@example.com' })
  @IsString()
  identifier: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ example: 'device-uuid-here' })
  @IsString()
  @IsOptional()
  deviceId?: string;

  @ApiPropertyOptional({ example: 'fcm-token-here' })
  @IsString()
  @IsOptional()
  fcmToken?: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}
