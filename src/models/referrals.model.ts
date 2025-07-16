import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { User } from '../user/user.schema';

@Schema({ timestamps: true })
export class Referral {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    ref: 'User',
    immutable: true,
  })
  user: User;
  //   @Prop({
  //     required: true,
  //     unique: true,
  //     immutable: true,
  //   })
  //   referralCode: string;
  //   @Prop({
  //     type: MongooseSchema.Types.ObjectId,
  //     ref: 'User',
  //     immutable: true,
  //   })
  //   referredBy: User
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
  })
  referredUser: User;

  @Prop({
    default: new Date(),
    immutable: true,
  })
  dateReferred: Date;

  @Prop({ default: false })
  paid: boolean;
}

export type ReferralType = HydratedDocument<Referral>;
export const ReferralSchema = SchemaFactory.createForClass(Referral);
