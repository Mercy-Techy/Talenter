import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: string;

  @Prop({ type: Number, required: true, min: 0, immutable: true })
  amount: number;

  @Prop({ type: Types.ObjectId, ref: 'Wallet' })
  wallet: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['pending', 'success', 'failed', 'reversed'],
    default: 'pending',
  })
  status: string;

  @Prop({ type: String, required: true, unique: true })
  reference: string;

  @Prop({ type: String })
  reason: string;

  @Prop({ default: false, enum: ['credit', 'debit'] })
  transactionType: string;
}

export type TransactionDocument = HydratedDocument<Transaction>;
export const TransactionSchema = SchemaFactory.createForClass(Transaction);
