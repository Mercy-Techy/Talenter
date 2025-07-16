import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class WalletHistory {
  @Prop({ required: true, immutable: true })
  amount: number;

  @Prop({ required: true, immutable: true })
  previousBalance: number;

  @Prop({ required: true, immutable: true, enum: ['credit', 'debit'] })
  type: string;

  @Prop({ required: true, immutable: true })
  description: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Wallet',
    required: true,
    immutable: true,
  })
  wallet: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    immutable: true,
  })
  user: Types.ObjectId;
}

export type WalletHistoryDocument = HydratedDocument<WalletHistory>;
export const WalletHistorySchema = SchemaFactory.createForClass(WalletHistory);
