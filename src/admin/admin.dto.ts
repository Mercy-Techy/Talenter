import { ApiProperty, OmitType } from '@nestjs/swagger';
import {
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Types } from 'mongoose';
import { CreateUserDto } from '../auth/auth.dto';

export class SendNotificationDto {
  @ApiProperty({
    name: 'userId',
    type: 'string',
    example: '667abfa5a84765075e66c338',
  })
  @IsOptional()
  @IsMongoId()
  userId: Types.ObjectId;

  @ApiProperty({
    name: 'message',
    type: 'string',
    example: 'Welcome to skill remit',
  })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({
    name: 'type',
    type: 'string',
    example: 'in-app',
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(['in-app', 'push'])
  type: string;

  @ApiProperty({
    name: 'title',
    type: 'string',
    example: 'Welcome message',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    name: 'to',
    type: 'string',
    example: 'all',
  })
  @IsOptional()
  @IsString()
  @IsIn(['all', 'client', 'artisan'])
  to: any;
}

export class UpdateUserStatusDto {
  @ApiProperty({
    name: 'userId',
    type: 'string',
    example: '667abfa5a84765075e66c338',
  })
  @IsMongoId()
  userId: Types.ObjectId;

  @ApiProperty({
    name: 'status',
    type: 'string',
    enum: ['active', 'inactive', 'suspended'],
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(['active', 'inactive', 'suspended'])
  status: string;
}

export class SendMailDto {
  @ApiProperty({ name: 'message', example: 'Welcome to skill remit' })
  @IsString()
  message: string;

  @ApiProperty({
    enum: ['client', 'artisan', 'all'],
    type: 'string',
    name: 'to',
  })
  @IsString()
  @IsIn(['client', 'artisan', 'all'])
  to: string;

  @ApiProperty({ example: 'Welcome Message', type: 'string' })
  @IsString()
  subject: string;
}

export class AddAdminDto extends OmitType(CreateUserDto, ['country', 'type']) {}
