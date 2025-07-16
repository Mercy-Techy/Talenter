import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ _id: false })
export class Address {
  @Prop()
  placeId: string;

  @Prop()
  location: string;
}

@Schema({ _id: false })
class About {
  @Prop()
  description: string;

  @Prop({ type: Address })
  homeAddress: Address;

  @Prop({ type: Address })
  officeAddress: Address;
}

@Schema()
export class User {
  @Prop({ required: true, trim: true, lowercase: true })
  firstName: string;
  @Prop({ required: true, trim: true, lowercase: true })
  lastName: string;
  @Prop({
    unique: true,
    immutable: true,
    index: true,
    sparse: true,
    required: true,
  })
  email: string;
  @Prop({ required: true, select: false })
  password: string;

  @Prop()
  lastLogin: Date;
  @Prop({ default: false })
  emailVerified: boolean;

  @Prop({ unique: true })
  phone: string;
  @Prop({ type: Types.ObjectId, ref: 'File' })
  avatar: Types.ObjectId;
  @Prop({
    default: 'artisan',
    enum: ['client', 'artisan', 'admin'],
    immutable: true,
  })
  type: string;

  @Prop({
    default() {
      return this.type === 'admin' ? 'admin' : 'none';
    },
    enum: ['super', 'admin', 'none'],
    immutable: true,
  })
  adminType: string;
  @Prop({
    required: true,
    enum: ['Nigeria'],
  })
  country: string;
  @Prop({
    enum: ['active', 'inactive', 'suspended'],
    default() {
      return this.type !== 'artisan' ? 'active' : 'inactive';
    },
  })
  status: string;
  @Prop()
  referralCode: string;
  @Prop({
    type: Types.ObjectId,
    ref: 'Wallet',
  })
  wallet: Types.ObjectId;
  @Prop({ default: 0 })
  projects: number;
  @Prop({ default: 1 })
  rating: number;
  @Prop({ default: 0 })
  ratingNo: number;
  @Prop({ default: 1 })
  ratingValue: number;
  @Prop({
    type: {
      uploads: [
        {
          type: Types.ObjectId,
          ref: 'File',
        },
      ],
      status: { type: String, default: 'Not Verified' },
    },
  })
  officialDocuments: any;
  @Prop({
    type: {
      uploads: [
        {
          type: Types.ObjectId,
          ref: 'File',
        },
      ],
      status: { type: String, default: 'Not Verified' },
    },
  })
  utilityBills: any;
  @Prop({
    type: {
      uploads: [
        {
          type: Types.ObjectId,
          ref: 'File',
        },
      ],
      status: { type: String, default: 'Not Verified' },
    },
  })
  workPlacePhotos: any;
  @Prop({ type: About })
  about: About;
  @Prop({ type: [String] })
  skills: string[];
  @Prop({ type: [String] })
  languages: string[];
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
