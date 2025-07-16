import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/user.schema';
import * as bcrypt from 'bcryptjs';
import { ScheduleModule } from '@nestjs/schedule';

const options: any = {
  deletedAt: true,
  deletedBy: true,
  overrideMethods: 'all',
};

@Module({
  providers: [QueueService],
  exports: [QueueService],
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeatureAsync([
      {
        name: User.name,
        useFactory: () => {
          const schema = UserSchema;
          schema.pre('save', async function (next) {
            if (this.isModified('password')) {
              this.password = await bcrypt.hash(this.password, 12);
            }
            next();
          });
          schema.plugin(require('mongoose-delete'), options);
          return schema;
        },
      },
    ]),
  ],
})
export class QueueModule {}
