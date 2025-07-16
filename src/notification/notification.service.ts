import { HttpStatus, Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';
import axios from 'axios';
import { ApiResponse } from '../utility/ApiResponse';
import { ConfigService } from '@nestjs/config';
import { Notification } from './notification.schema';
import { UserService } from '../user/user.service';
import { UserDocument } from '../user/user.schema';
import paginateFunction from '../utility/paginateFunction';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,
    private userService: UserService,
    private configService: ConfigService,
  ) {}
  async createNotification(
    details: { type: string; message: string; title: string; payload?: any },
    toSend: any,
    notificationType: string = 'in-app',
    push: boolean = true,
  ) {
    try {
      const { type, message, payload, title } = details;
      let userIds: any;
      if (toSend === 'admins') {
        const { data: admins, ...userDetails } = await this.userService.getUser(
          { isAdmin: true },
        );

        userIds = userDetails.status
          ? admins.map((user: UserDocument) => user._id)
          : [];
      }
      if (!userIds) {
        userIds = toSend;
      }
      if (push) {
        // try {
        //   const ids = userIds.map((id: ObjectId) => id.toString());
        //   const data = {
        //     app_id: this.configService.get<string>('ONESIGNAL_APP_ID'),
        //     contents: { en: message },
        //     channel_for_external_user_ids: notificationType || 'push',
        //     include_external_user_ids: ids,
        //     data: { id: payload?._id, type },
        //     content_available: true,
        //   };
        //   const headers = {
        //     'Content-Type': 'application/json; charset=utf-8',
        //     Authorization:
        //       'Basic ' + this.configService.get<string>('ONESIGNAL_API_KEY'),
        //   };
        //   await axios.post('https://onesignal.com/api/v1/notifications', data, {
        //     headers,
        //   });
        // } catch (error) {
        //   console.log(error.message);
        // }
      }
      for (let userId of userIds) {
        await this.notificationModel.create({
          message,
          payload,
          type,
          user: userId,
          title,
          notificationType,
        });
      }
      return ApiResponse.success('Notfication created', HttpStatus.OK, null);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
  async fetchNotifications(
    userId: Types.ObjectId,
    page?: number,
    limit?: number,
  ) {
    return await paginateFunction(
      this.notificationModel,
      page,
      limit,
      null,
      {
        user: userId,
      },
      'createdAt',
      -1,
    );
  }
  async markNotificationAsRead(
    userId: Types.ObjectId,
    notificationId: Types.ObjectId,
  ) {
    try {
      const notification = await this.notificationModel.findOne({
        user: userId,
        _id: notificationId,
      });
      if (!notification)
        return ApiResponse.fail(
          'Notification does not exist',
          HttpStatus.NOT_FOUND,
          null,
        );
      notification.read = true;
      await notification.save();
      return ApiResponse.success(
        'Notification marked as read',
        HttpStatus.OK,
        notification,
      );
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
  async deleteNotification(notificationId: Types.ObjectId, user: UserDocument) {
    try {
      const notification =
        await this.notificationModel.findById(notificationId);
      if (notification) {
        if (
          user._id.toString() !== notification.user.toString() &&
          user.type !== 'admin'
        )
          return ApiResponse.fail(
            'Action cannot be completed',
            HttpStatus.BAD_REQUEST,
            null,
          );
        await this.notificationModel.deleteOne({ _id: notificationId });
      }
      return ApiResponse.success('Notification deleted', HttpStatus.OK, null);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
}
