import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AddressDto } from '../user/user.dto';
import { Transform, Type } from 'class-transformer';
import { Types } from 'mongoose';

export class CreateJobDto {
  @IsNotEmpty()
  @IsString()
  service: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  placeId: string;

  @IsNotEmpty()
  @IsString()
  location: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  budget: number;

  @IsNotEmpty()
  @IsString()
  skills: string;
}

const properties = {
  jobImages: {
    required: true,
    type: 'string',
    format: 'binary',
    description:
      'It can be more than one image, but they must all have the fieldname jobImage',
  },
  service: {
    required: true,
    type: 'string',
    example: '662a6b6bf3d71e6c526481d3',
    description: 'Service Mongoose Id',
  },
  description: {
    required: true,
    type: 'string',
    example: 'Designing a Jotter',
  },
  budget: { required: true, type: 'number', example: 5000 },
  skills: {
    required: true,
    type: 'string',
    example: 'excellent',
    description: 'skills should be seperated by comma',
  },
  location: {
    required: true,
    type: 'string',
    example: '12, Command Ogbomoso',
  },
  placeId: { required: true, type: 'string', example: 'CFTYHU7895' },
};

export const createJobBody = {
  required: true,
  type: 'multipart/form-data',
  schema: {
    type: 'object',
    properties,
  },
};
export const updateJobBody = {
  required: true,
  type: 'multipart/form-data',
  schema: {
    type: 'object',
    properties: {
      ...properties,
      jobId: {
        required: true,
        type: 'string',
        example: '662fad34dd2cb5290e012bcf',
      },
      service: {
        required: true,
        type: 'string',
        example: 'chef',
      },
    },
  },
};

export const paramJobId = { name: 'jobId', type: 'string', required: true };

export class createBidDto {
  @ApiProperty({
    name: 'job',
    required: true,
    example: '662fad34dd2cb5290e012bcf',
  })
  @IsMongoId()
  job: Types.ObjectId;

  @ApiProperty({
    name: 'price',
    required: true,
    example: 10000,
  })
  @IsNumber()
  price: number;
}

export class UpdateBidDto {
  @ApiProperty({
    name: 'bidId',
    required: true,
    example: '662fad34dd2cb5290e012bcf',
  })
  @IsMongoId()
  bidId: Types.ObjectId;

  @ApiProperty({
    name: 'price',
    required: false,
    example: 10000,
  })
  @IsOptional()
  @IsNumber()
  price: number;

  @ApiProperty({
    name: 'status',
    required: true,
    example: 'delivered',
  })
  @IsOptional()
  @IsString()
  @IsIn(['in-progress', 'delivered', 'rejected', 'completed'])
  status: string;
}

export class UpdateJobDto {
  @ApiProperty({
    name: 'bidId',
    required: true,
    example: '662fad34dd2cb5290e012bcf',
  })
  @IsMongoId()
  bidId: Types.ObjectId;

  @ApiProperty({
    name: 'status',
    required: true,
    example: 'completed',
  })
  @IsString()
  @IsIn(['in-progress', 'completed'])
  status: string;
}
