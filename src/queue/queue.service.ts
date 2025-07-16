import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
// import { NotificationService } from '../notification/notification.service';
import { ApiResponse } from '../utility/ApiResponse';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../user/user.schema';
import { Model } from 'mongoose';
import { mailService } from '../utility/mailer';

export class QueueService {
  private emails: string[] = [];
  private message: { content: string; subject: string };
  private isProcessing: boolean = false;

  constructor(
    // private notificationService: NotificationService,
    @InjectModel(User.name) private userModel: Model<User>,
    private scheduleRegistry: SchedulerRegistry,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM, { name: 'mailer' })
  async emailScheduler() {
    try {
      if (this.emails.length > 0) {
        const emails = this.emails.splice(0, 500);
        this.isProcessing === true;
        await mailService(
          emails,
          this.message.subject,
          this.message,
          'general',
        );
        if (this.emails.length < 1) {
          this.isProcessing = false;
          const job = this.scheduleRegistry.getCronJob('mailer');
          job.stop();
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  async sendEmail(to: string, message: string, subject: string) {
    try {
      if (this.emails.length > 0) {
        throw new Error('Mail dispatch process ongoing, try again later');
      }
      let users: any;
      if (to === 'client') {
        users = await this.userModel
          .find({ type: 'client' })
          .select('email firstName');
      } else if (to === 'artisan') {
        users = await this.userModel
          .find({ type: 'artisan' })
          .select('email firstName');
      } else if (to === 'all') {
        users = await this.userModel.find().select('email firstName');
      } else {
        throw new Error('Mail receiver not specified');
      }
      this.emails = users.map((user) => user.email);
      this.message = { content: message, subject };
      this.emailScheduler();
      return ApiResponse.success(
        'Mail dispatch is already in progress',
        HttpStatus.OK,
        null,
      );
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.OK, error);
    }
  }
}
