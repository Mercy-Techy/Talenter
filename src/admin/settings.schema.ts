import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

@Schema()
export class Settings {
  @Prop({ default: 0 })
  referralBonusPercent: number;
  @Prop({ default: 0 })
  minimumIOSVersion: number;
  @Prop({ default: 0 })
  minimumAndroidVersion: number;
  @Prop({ default: 0 })
  minimumBonusPayout: number;
  @Prop()
  bankName: string;
  @Prop()
  accountName: string;
  @Prop()
  accountNumber: string;
  @Prop()
  bankCode: string;
  @Prop({ default: 0 })
  deliveryFee: number;
  @Prop({
    default: 1.5,
    min: 0,
    max: 100,
  })
  chargePercent: number;
  @Prop({
    default: 5,
    min: 0,
    max: 100,
  })
  commissionPercent: number;
  @Prop({ default: 100000 })
  distance: number;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  admin: Types.ObjectId;
}

export type SettingsDocument = HydratedDocument<Settings>;
export const SettingsSchema = SchemaFactory.createForClass(Settings);
