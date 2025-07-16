import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class WithDrawDto {
  @ApiProperty({
    required: true,
    type: 'string',
    example: '662fad34dd2cb5290e012bcf',
  })
  @IsMongoId()
  bankId: Types.ObjectId;

  @ApiProperty({
    required: true,
    type: 'number',
    example: 5000,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    required: true,
    type: 'string',
    example: 'i want to pay for some bills',
  })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiProperty({
    required: true,
    type: 'string',
    example: '1234',
  })
  @IsNotEmpty()
  @IsString()
  pin: string;
}

export class FundWalletDto {
  @ApiProperty({
    required: true,
    type: 'string',
    example: '4291960050220617',
  })
  @IsNotEmpty()
  @IsString()
  reference: string;
}
