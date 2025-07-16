import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Message {
  @Prop({
    type: Types.ObjectId,
    ref: 'Chat',
    required: true,
  })
  chat: Types.ObjectId;
  @Prop({
    enum: ['text', 'file', 'info'],
    default: 'text',
  })
  type: string;
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  sender: Types.ObjectId;
  @Prop({
    type: [
      {
        type: Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
  })
  receivers: Types.ObjectId[];
  @Prop({
    type: [
      {
        type: Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
  })
  read: Types.ObjectId[];
  @Prop({ required: true })
  content: MongooseSchema.Types.Mixed;
  @Prop({
    type: [Types.ObjectId],
    ref: 'File',
  })
  fileIds: Types.ObjectId[];
}

export type MessageDocument = HydratedDocument<Message>;
export const MessageSchema = SchemaFactory.createForClass(Message);
