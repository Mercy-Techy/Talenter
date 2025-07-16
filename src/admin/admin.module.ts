import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Settings, SettingsSchema } from './settings.schema';
import { UserModule } from '../user/user.module';
import { JobModule } from '../Job/job.module';
import { NotificationModule } from '../notification/notification.module';
import { TransactionModule } from '../transaction/transaction.module';
import { QueueModule } from '../queue/queue.module';
import { Review, ReviewSchema } from '../review/review.schema';

@Module({
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService, MongooseModule],
  imports: [
    UserModule,
    JobModule,
    TransactionModule,
    NotificationModule,
    QueueModule,
    MongooseModule.forFeature([
      { name: Settings.name, schema: SettingsSchema },
      { name: Review.name, schema: ReviewSchema },
    ]),
  ],
})
export class AdminModule {}
