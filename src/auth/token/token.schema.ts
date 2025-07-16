import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class Token {
  @Prop({ required: true })
  token: string;
  @Prop({
    enum: ['verify-email', 'reset-password', 'set-pin'],
    required: true,
  })
  type: string;
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
  })
  user: Types.ObjectId;
  @Prop({ type: MongooseSchema.Types.Mixed })
  payload: any;
  @Prop({ default: false })
  expired: boolean;
  @Prop()
  expireAt: Date;
}

export type TokenDocument = HydratedDocument<Token>;
export const TokenSchema = SchemaFactory.createForClass(Token);
