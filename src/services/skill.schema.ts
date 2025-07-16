import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Skill {
  @Prop({ required: true, unique: true, lowercase: true })
  title: string;
}

export type SkillDocument = HydratedDocument<Skill>;
export const SkillSchema = SchemaFactory.createForClass(Skill);
