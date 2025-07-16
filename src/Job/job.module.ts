import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Job, JobSchema } from './job.schema';
import { JobService } from './job.service';
import { FileModule } from '../File/file.module';
import { JobController } from './job.controller';
import { AddressModule } from '../address/address.module';
import { NotificationModule } from '../notification/notification.module';
import { Bid, BidSchema } from './Bid.schema';
import { UserModule } from '../user/user.module';
import { ChatModule } from '../chat/chat.module';
import { ServicesModule } from '../services/services.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    ServicesModule,
    MongooseModule.forFeature([{ name: Job.name, schema: JobSchema }]),
    MongooseModule.forFeatureAsync([
      {
        name: Bid.name,
        useFactory: () => {
          const schema = BidSchema;
          schema.pre('save', async function (next) {
            if (this.isModified('status')) {
              if (
                this.status === 'rejected' ||
                this.status === 'cancelled' ||
                this.status === 'completed'
              ) {
                this.available = false;
              }
            }
            next();
          });
          return schema;
        },
      },
    ]),
    FileModule,
    ChatModule,
    AddressModule,
    NotificationModule,
    UserModule,
    WalletModule,
  ],
  controllers: [JobController],
  providers: [JobService],
  exports: [JobService, MongooseModule],
})
export class JobModule {}
