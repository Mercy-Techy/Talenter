import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Service {
  @Prop({ required: true, unique: true, lowercase: true })
  title: string;
  @Prop({ type: Types.ObjectId, ref: 'File' })
  image: Types.ObjectId;
}

export type ServiceDocument = HydratedDocument<Service>;
export const ServiceSchema = SchemaFactory.createForClass(Service);
