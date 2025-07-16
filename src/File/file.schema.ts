import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class File {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  public_id: string;

  @Prop()
  name: string;

  @Prop()
  originalname: string;

  @Prop({ enum: ['image', 'video', 'audio', 'document'] })
  type: string;

  @Prop()
  size: string;

  @Prop()
  format: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    immutable: true,
  })
  uploadedBy: Types.ObjectId;
}

export type FileDocument = HydratedDocument<File>;
export const FileSchema = SchemaFactory.createForClass(File);
