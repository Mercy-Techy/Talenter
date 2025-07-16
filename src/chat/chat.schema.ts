import { Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Chat {
  @Prop({
    type: [Types.ObjectId],
    ref: 'User',
    required: true,
  })
  users: Types.ObjectId[];
  @Prop({
    enum: ['user', 'admin'],
    default: 'user',
  })
  type: string;
  @Prop({
    type: Types.ObjectId,
    ref: 'Bid',
  })
  bid: Types.ObjectId;
  @Prop({
    default: 0,
  })
  newMessageCount: number;
  @Prop()
  lastMessageDate: Date;

  @Prop({
    type: Types.ObjectId,
    ref: 'Message',
  })
  lastMessage: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User' })
  lastMessageBy: Types.ObjectId;
}

export type ChatDocument = HydratedDocument<Chat>;
export const ChatSchema = SchemaFactory.createForClass(Chat);
