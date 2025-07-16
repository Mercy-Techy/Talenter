import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Bid {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Job' })
  job: Types.ObjectId;
  @Prop({ default: true })
  available: boolean;
  @Prop({ required: true, type: Types.ObjectId, ref: 'Chat' })
  chat: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  artisan: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  client: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  price: number;
  @Prop({
    default: 'pending',
    enum: [
      'pending',
      'accepted',
      'rejected',
      'in-progress',
      'delivered',
      'completed',
      'cancelled',
    ],
  })
  status: string;
  @Prop({
    type: Types.ObjectId,
    ref: 'WalletHistory',
    required: false,
  })
  transaction: Types.ObjectId;
  @Prop()
  dateDelivered: Date;
}

export type BidDocument = HydratedDocument<Bid>;
export const BidSchema = SchemaFactory.createForClass(Bid);
