import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;
  @Prop()
  type: string;
  @Prop({ enum: ['push', 'in-app'] })
  notificationType: string;
  @Prop({ required: true })
  message: string;
  @Prop()
  title: string;
  @Prop({ default: false })
  read: boolean;
  @Prop({ type: Types.ObjectId, refPath: 'type' })
  payload: any;
}

export type NotificationDocument = HydratedDocument<Notification>;
export const NotificationSchema = SchemaFactory.createForClass(Notification);
