import { IsString, IsOptional, IsUrl, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AddressType } from '../../../../../libs/database/src/entities/user-address.entity';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsUrl()
  @IsOptional()
  profilePicture?: string;
}

export class AddAddressDto {
  @ApiPropertyOptional({ enum: AddressType, default: AddressType.HOME })
  @IsEnum(AddressType)
  @IsOptional()
  label?: AddressType;

  @ApiProperty({ example: '123 Main St' })
  @IsString()
  addressLine1: string;

  @ApiPropertyOptional({ example: 'Apartment 4B' })
  @IsString()
  @IsOptional()
  addressLine2?: string;

  @ApiProperty({ example: 'London' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'SW1A 1AA' })
  @IsString()
  postcode: string;

  @ApiProperty({ example: 51.5074 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: -0.1278 })
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ example: 'Ring the doorbell' })
  @IsString()
  @IsOptional()
  deliveryNotes?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isDefault?: boolean;
}
