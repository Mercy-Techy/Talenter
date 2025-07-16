import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class sendMessageDto {
  @IsNotEmpty()
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  content: string;

  @IsMongoId()
  chatId: Types.ObjectId;
}

export const sendMessageBody = {
  required: true,
  type: 'multipart/form-data',
  schema: {
    type: 'object',
    properties: {
      chatId: {
        required: false,
        type: 'string',
        example: '662fad34dd2cb5290e012bcf',
      },
      content: {
        required: false,
        type: 'string',
        example: 'Hi, my name is mercy',
      },
      type: {
        required: true,
        type: 'string',
        example: 'text',
        description: 'Can either be text or file',
      },
      chatImages: {
        type: 'string',
        format: 'binary',
        required: false,
      },
    },
  },
};

export class messageAdminDto {
  @IsNotEmpty()
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  receiverId: Types.ObjectId;
}

export const messageAdminBody = {
  required: true,
  type: 'multipart/form-data',
  schema: {
    type: 'object',
    properties: {
      content: {
        required: false,
        type: 'string',
        example: 'Hi, my name is mercy',
      },
      type: {
        required: true,
        type: 'string',
        example: 'text',
        description: 'Can either be text or file',
      },
      chatImages: {
        type: 'string',
        format: 'binary',
        required: false,
      },
      receiverId: {
        required: false,
        type: 'string',
        example: '662fad34dd2cb5290e012bcf',
      },
    },
  },
};
