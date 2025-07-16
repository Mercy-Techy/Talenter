import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../user/user.schema';

@Schema({ timestamps: true })
export class Bank {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: User;

  // @Prop({ required: true, select: false })
  // recipientCode: string;

  @Prop({ required: true })
  bankName: string;

  @Prop({ required: true })
  accountNumber: string;

  @Prop({ required: true })
  accountName: string;

  @Prop({ required: true })
  bankCode: string;

  @Prop({ required: true })
  type: string;

  @Prop()
  isDefault: boolean;
}

export type BankDocument = HydratedDocument<Bank>;
export const BankSchema = SchemaFactory.createForClass(Bank);
