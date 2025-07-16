import {
  IsString,
  ValidateNested,
  IsPhoneNumber,
  IsNotEmpty,
  IsIn,
  IsOptional,
  IsArray,
  Validate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AddressDto {
  @ApiProperty({ required: true, example: '1a2s3d4f5g6h' })
  placeId: string;

  @ApiProperty({
    required: true,
    example: '14, Adekunle street command ipaja.',
  })
  location: string;
}

export class AboutDto {
  @ApiProperty({ example: 'A very hardworking individual' })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({ type: AddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  homeAddress: AddressDto;

  @ApiProperty({ type: AddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  officeAddress: AddressDto;
}

export class UpdateProfileDto {
  @ApiProperty({ required: true, example: 'Arawole' })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ required: true, example: 'Mercy' })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({ required: true, example: '09023007788' })
  @IsOptional()
  @IsPhoneNumber('NG')
  phone: string;

  @ApiProperty({
    required: true,
    example: 'Nigeria',
  })
  @IsOptional()
  @IsString()
  @IsIn(['Nigeria'])
  country: string;

  @ApiProperty({ type: AboutDto })
  @IsOptional()
  about: AboutDto;
  @ApiProperty({ type: [String] })
  @IsOptional()
  @IsArray()
  skills: string[];
  @IsArray()
  @ApiProperty({ type: [String] })
  @IsOptional()
  languages: string[];
}

export const verifyAccountBody = {
  required: true,
  type: 'multipart/form-data',
  schema: {
    type: 'object',
    properties: {
      workPlacePhotos: {
        type: 'string',
        format: 'binary',
        description:
          'It can be more than one image, but they must all have the fieldname workPlacePhotos',
      },
      utilityBills: {
        type: 'string',
        format: 'binary',
        description:
          'It can be more than one image, but they must all have the fieldname utilityBills',
      },
      officialDocuments: {
        type: 'string',
        format: 'binary',
        description:
          'It can be more than one image, but they must all have the fieldname officialDocuments',
      },
    },
  },
};
