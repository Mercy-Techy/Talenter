import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';
import { Types } from 'mongoose';

export class EditServiceDto {
  @ApiProperty({ name: 'serviceId', type: 'string', required: true })
  @IsMongoId()
  serviceId: Types.ObjectId;

  @ApiProperty({ name: 'serviceId', type: 'string', required: false })
  @IsOptional()
  @IsNotEmpty()
  title: string;
}
