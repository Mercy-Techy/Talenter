import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Settings } from './settings.schema';
import { ApiResponse } from '../utility/ApiResponse';
import { UserService } from '../user/user.service';
import { JobService } from '../Job/job.service';
import { NotificationService } from '../notification/notification.service';
import { TransactionService } from '../transaction/transaction.service';
import { AddAdminDto, SendMailDto, SendNotificationDto } from './admin.dto';
import { QueueService } from '../queue/queue.service';
import { UserDocument } from '../user/user.schema';
import { Review } from '../review/review.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Settings.name) private settingsModel: Model<Settings>,
    @InjectModel(Review.name) private reviewModel: Model<Review>,
    private userService: UserService,
    private jobService: JobService,
    private notificationService: NotificationService,
    private transactionService: TransactionService,
    private queueService: QueueService,
  ) {}

  async fetchSettings() {
    try {
      let settings = await this.settingsModel.findOne();
      if (!settings) {
        const admin = await this.userService.getUser({ adminType: 'super' });
        if (!admin.status) return admin;
        settings = await this.settingsModel.create({
          distance: 10000,
          admin: admin.data._id,
        });
      }
      return ApiResponse.success('settings', HttpStatus.OK, settings);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async fetchUsers(filter: any, page: number, limit: number) {
    try {
      return await this.userService.getUsers(filter, true, page, limit);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async searchUsers(searchString: string = '', status: string) {
    try {
      let filter = {};
      if (status && status !== 'null') {
        filter = { status };
        if (status === 'artisan' || status === 'client') {
          filter = { type: status };
        }
      }
      const searchTerms = searchString.trim().split(/\s+/);
      const queries = searchTerms.map((term) => ({
        $or: [
          { firstName: { $regex: term, $options: 'i' } },
          { lastName: { $regex: term, $options: 'i' } },
        ],
      }));
      return await this.userService.getUsers({
        $and: queries,
        ...filter,
      });
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async searchAdmins(searchString: string = '') {
    try {
      const searchTerms = searchString.trim().split(/\s+/);
      const queries = searchTerms.map((term) => ({
        $or: [
          { firstName: { $regex: term, $options: 'i' } },
          { lastName: { $regex: term, $options: 'i' } },
        ],
      }));
      return await this.userService.getUsers({
        $and: queries,
        type: 'admin',
      });
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async updateUserStatus(userId: Types.ObjectId, status: string) {
    try {
      let user: any;
      if (status === 'active') {
        user = await this.userService.verifyUserOfficialDocument(userId);
        if (!user.status) return user;
      } else {
        user = await this.userService.updateUser(userId, { status });
        if (!user.status) return user;
      }
      return ApiResponse.success(
        'User status updated',
        HttpStatus.OK,
        user.data,
      );
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async sendEmail(mailData: SendMailDto) {
    return this.queueService.sendEmail(
      mailData.to,
      mailData.message,
      mailData.subject,
    );
  }

  async sendNotification(notificationDetails: SendNotificationDto) {
    let { message, title, type, userId, to } = notificationDetails;
    try {
      let sendTo = [userId];
      let filter =
        to === 'client'
          ? { type: 'client' }
          : to === 'artisan'
            ? { type: 'artisan' }
            : {};
      if (to) {
        const users = await this.userService.getUsers(filter);
        if (!users.status) return users;
        sendTo = users.data.map((user) => user._id);
      }
      this.notificationService.createNotification(
        { type: 'Admin', message, title },
        sendTo,
        type,
        type === 'push' ? true : false,
      );
      return ApiResponse.success(
        'Notification dispatch is in progress',
        HttpStatus.OK,
        null,
      );
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async fetchTransactions(page: number, limit: number, adminId: string = null) {
    if (adminId) {
      const user = new Types.ObjectId(adminId);
      return this.transactionService.fetchTransaction(page, limit, { user });
    }
    return this.transactionService.fetchTransaction(page, limit);
  }

  async updateSettings(update: any) {
    try {
      const settings = (await this.fetchSettings()).data;
      const updatedSettings = await this.settingsModel.findOneAndUpdate(
        { _id: settings._id },
        update,
        { new: true },
      );
      return ApiResponse.success(
        'Update successful',
        HttpStatus.OK,
        updatedSettings,
      );
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async fetchJobs(filter: any, page: number, limit: number) {
    try {
      return this.jobService.fetchJobs(filter, page, limit);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async fetchJobsNumbers() {
    try {
      return this.jobService.fetchJobNumbers();
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async dashBoardData() {
    try {
      const totalUser = await this.userService.userNo();
      const activeUser = await this.userService.userNo({ status: 'active' });
      const totalJobs = await this.jobService.jobNo();
      const totalReviews = await this.reviewModel.countDocuments();
      return ApiResponse.success('Dashboard data', HttpStatus.OK, {
        totalUser,
        activeUser,
        totalJobs,
        totalReviews,
      });
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async addAdmin(userDetails: AddAdminDto, admin: UserDocument) {
    try {
      if (admin.adminType !== 'super')
        throw new Error('Action can only be carried out the super admin');
      return await this.userService.createUser(
        { ...userDetails, type: 'admin', country: 'Nigeria' },
        true,
      );
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async editAdmin(userId: Types.ObjectId, update: any, admin: UserDocument) {
    try {
      if (admin.adminType !== 'super')
        throw new Error('Action can only be carried out the super admin');
      return await this.userService.updateUser(userId, update);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async deleteAdmin(userId: Types.ObjectId, admin: UserDocument) {
    try {
      if (admin.adminType !== 'super')
        throw new Error('Action can only be carried out the super admin');
      if (userId.toString() === admin._id.toString())
        throw new Error('Super admin account cannot be deleted');
      return await this.userService.deleteAccount(userId);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async fetchAdmins(page: number, limit: number) {
    try {
      return await this.userService.getUsers(
        { type: 'admin' },
        true,
        page,
        limit,
      );
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async fetchUsersNumbers() {
    try {
      const totalUsers = await this.userService.userNo();
      const activeUsers = await this.userService.userNo({ status: 'active' });
      const pendingUsers = await this.userService.userNo({
        status: 'inactive',
      });
      const suspendedUsers = await this.userService.userNo({
        status: 'suspended',
      });
      const artisans = await this.userService.userNo({ type: 'artisan' });
      const clients = await this.userService.userNo({ type: 'client' });
      return ApiResponse.success('Users', HttpStatus.OK, {
        totalUsers,
        activeUsers,
        pendingUsers,
        suspendedUsers,
        artisans,
        clients,
      });
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
}
