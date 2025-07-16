import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GetAccountName {
  @ApiProperty({ type: 'string', example: '058' })
  @IsNotEmpty()
  @IsString()
  bankCode: string;

  @ApiProperty({ type: 'string', example: '0280345678' })
  @IsNotEmpty()
  @IsString()
  accountNumber: string;

  @ApiProperty({ type: 'string', example: 'First bank' })
  @IsNotEmpty()
  @IsString()
  bankName: string;

  @ApiProperty({ type: 'string', example: 'nuban' })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  isDefault: boolean;
}
