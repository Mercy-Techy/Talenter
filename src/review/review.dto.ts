import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: '663a376eb46a86414b3f5792' })
  @IsMongoId()
  userId: string;

  @ApiProperty({ example: 'very good' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ example: 5 })
  @IsInt()
  rating: number;
}

export class UpdateReviewDto {
  @ApiProperty({ example: 'very good' })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ example: 4 })
  @IsOptional()
  @IsInt()
  rating: number;

  @ApiProperty({ example: '663a376eb46a86414b3f5792' })
  @IsOptional()
  @IsMongoId()
  reviewId: string;
}
