import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Address } from '../user/user.schema';

@Schema({ timestamps: true })
export class Job {
  @Prop({
    required: true,
  })
  service: string;
  @Prop({ required: true, type: Address })
  address: Address;
  @Prop({ required: true, enum: ['Nigeria'] })
  country: string;
  @Prop({ required: true, minlength: 10 })
  description: string;
  @Prop({
    enum: ['pending', 'assigned', 'accepted', 'completed', 'in-progress'],
    default: 'pending',
  })
  status: string;
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    immutable: true,
  })
  createdBy: Types.ObjectId;
  @Prop({
    type: String,
    enum: ['NGN', 'GHS'],
    required: true,
    default: 'NGN',
  })
  currency: string;
  @Prop({ required: true })
  budget: Number;
  @Prop({
    type: [String],
  })
  skills: [String];
  @Prop({ type: Types.ObjectId, ref: 'File' })
  images: Types.ObjectId[];
  @Prop({
    type: [
      {
        type: Types.ObjectId,
        ref: 'User',
      },
    ],
  })
  savedBy: Types.ObjectId[];
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
  })
  assignedTo: Types.ObjectId;
  @Prop()
  initialCharge: number;
  @Prop({
    type: Types.ObjectId,
    ref: 'Bid',
  })
  bid: Types.ObjectId;
  @Prop({
    required() {
      return this.status === 'in-progress';
    },
    default: 0,
  })
  price: number;

  @Prop()
  troubleshooterDescription: string;
  // @Prop({
  //   type: Types.ObjectId,
  //   ref: 'Feedback',
  // })
  // feedback: FeedBack
}

export type JobDocument = HydratedDocument<Job>;
export const JobSchema = SchemaFactory.createForClass(Job);
