import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Job } from './job.schema';
import { Model, Types } from 'mongoose';
import { CreateJobDto, UpdateBidDto, createBidDto } from './job.dto';
import { ApiResponse } from '../utility/ApiResponse';
import { UserDocument } from '../user/user.schema';
import { FileService } from '../File/file.service';
import { NotificationService } from '../notification/notification.service';
import { UserService } from '../user/user.service';
import { Bid } from './Bid.schema';
import { ChatService } from '../chat/chat.service';
import { ServicesService } from '../services/services.service';
import { WalletService } from '../wallet/wallet.service';
import { AddressService } from '../address/address.service';
import paginateFunction from '../utility/paginateFunction';

@Injectable()
export class JobService {
  constructor(
    @InjectModel(Job.name) private jobModel: Model<Job>,
    @InjectModel(Bid.name) private bidModel: Model<Bid>,
    private fileService: FileService,
    private notificationService: NotificationService,
    private userService: UserService,
    private chatService: ChatService,
    private servicesService: ServicesService,
    private walletService: WalletService,
    private addressService: AddressService,
  ) {}
  async fetchUserJobReport(userId: Types.ObjectId) {
    const noOfJobs = await this.jobModel.countDocuments({ assignedTo: userId });
    const pendingJobs = await this.jobModel.countDocuments({
      assignedTo: userId,
      status: { $ne: 'completed' },
    });
    return { pendingJobs, noOfJobs };
  }
  async createJob(
    createJob: CreateJobDto,
    user: UserDocument,
    jobImages?: Express.Multer.File[],
  ) {
    try {
      let images = [];
      if (jobImages) {
        const uploadedFiles = await this.fileService.createFiles(
          jobImages,
          user._id,
          'image',
        );
        if (uploadedFiles.status) images = uploadedFiles.data;
      }
      const service = await this.servicesService.fetchService({
        _id: createJob.service,
      });
      if (!service.status) return service;
      const job = await this.jobModel.create({
        ...createJob,
        service: service.data.title,
        createdBy: user,
        country: user.country,
        images,
        skills: createJob.skills.split(','),
        address: { location: createJob.location, placeId: createJob.placeId },
      });
      const artisans = await this.userService.fetchArtisans(
        service.data.title,
        createJob.placeId,
      );
      if (artisans?.data?.length) {
        this.notificationService.createNotification(
          {
            type: 'Job',
            message: `There's a new job request from ${user.firstName}`,
            title: 'New Job Notification',
            payload: job._id,
          },
          artisans.data,
          null,
          true,
        );
      }
      return ApiResponse.success('Job created', HttpStatus.OK, job);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
  async fetchJob(filter: any, userId: Types.ObjectId) {
    try {
      const job = await (
        await this.jobModel.findOne(filter)
      ).populate([
        {
          path: 'createdBy',
          select: 'firstName lastName',
        },
        {
          path: 'images',
          select: 'url',
        },
      ]);
      if (!job) {
        return ApiResponse.fail(
          'Job does not exist',
          HttpStatus.NOT_FOUND,
          null,
        );
      }
      const jobExist = job.savedBy.find(
        (user) => user.toString() === userId.toString(),
      );
      const jobDetails = {
        ...job.toObject(),
        savedByUser: jobExist ? true : false,
      };
      return ApiResponse.success('Job', HttpStatus.OK, jobDetails);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
  async fetchJobs(
    filter: any,
    page?: number,
    limit?: number,
    userId?: Types.ObjectId,
  ) {
    try {
      const closeJobs = await paginateFunction(
        this.jobModel,
        page,
        limit,
        [
          { path: 'createdBy' },
          { path: 'images', select: 'url' },
          { path: 'assignedTo' },
        ],
        filter,
        'createdAt',
        -1,
      );
      if (closeJobs.status && userId) {
        const data = closeJobs.data.data.map((job) => {
          const jobExist = job.savedBy.find(
            (user) => user.toString() === userId.toString(),
          );
          const jobDetails = {
            ...job.toObject(),
            savedByUser: jobExist ? true : false,
          };
          return jobDetails;
        });
        closeJobs.data.data = data;
      }
      return closeJobs;
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async fetchcloseJobs(user: UserDocument, page?: number) {
    try {
      const jobs = await paginateFunction(
        this.jobModel,
        page,
        20,
        [
          {
            path: 'createdBy',
            select: 'firstName lastName',
          },
          {
            path: 'images',
            select: 'url',
          },
        ],
        { status: 'pending' },
        'createdAt',
        -1,
      );
      if (!jobs.status) return jobs;
      let closeJobs: any = jobs;
      if (user?.about?.officeAddress?.placeId) {
        const response = await this.addressService.fetchCloseObjects(
          user?.about?.officeAddress?.placeId,
          jobs.data.data,
          'job',
        );
        if (response.status) closeJobs.data.data = response.data;
      }
      const data = closeJobs.data.data.map((job) => {
        const jobExist = job.savedBy.find(
          (us) => us.toString() === user._id.toString(),
        );
        const jobDetails = {
          ...job.toObject(),
          savedByUser: jobExist ? true : false,
        };
        return jobDetails;
      });
      closeJobs.data.data = data;

      return closeJobs;
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
  async saveJob(userId: Types.ObjectId, jobId: Types.ObjectId) {
    try {
      const job = await this.jobModel.findById(jobId);
      const existingJob = job?.savedBy.find(
        (user) => user.toString() === userId.toString(),
      );
      if (job && !existingJob) {
        job.savedBy.push(userId);
        await job.save();
      }
      return ApiResponse.success('Successful', HttpStatus.OK, null);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async unSaveJob(userId: Types.ObjectId, jobId: Types.ObjectId) {
    try {
      const job = await this.jobModel.findById(jobId);
      const updatedSavedBy = job?.savedBy.filter(
        (user) => user.toString() !== userId.toString(),
      );
      job.savedBy = updatedSavedBy;
      await job.save();
      return ApiResponse.success('Successful', HttpStatus.OK, null);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
  async editJob(
    user: UserDocument,
    jobId: Types.ObjectId,
    details: CreateJobDto,
    jobImages?: Express.Multer.File[],
  ) {
    try {
      const job = await this.jobModel.findOne({
        _id: jobId,
        createdBy: user._id,
      });
      if (!job) {
        return ApiResponse.fail(
          'Job does not exist',
          HttpStatus.NOT_FOUND,
          null,
        );
      }
      if (job.status !== 'pending')
        return ApiResponse.fail(
          'This action cannot be completed',
          HttpStatus.BAD_REQUEST,
          null,
        );
      let images = job.images;
      if (jobImages) {
        if (job.images?.length > 0) {
          await this.fileService.deleteFiles(job.images);
        }
        const uploadedFiles = await this.fileService.createFiles(
          jobImages,
          user._id,
          'image',
        );
        if (uploadedFiles.status) images = uploadedFiles.data;
      }
      const service = await this.servicesService.fetchService({
        title: details.service,
      });
      if (!service.status) return service;
      const updatedJob = await this.jobModel.findOneAndUpdate(
        { _id: job._id },
        {
          ...details,
          address: { placeId: details.placeId, location: details.location },
          images,
        },
        { new: true },
      );
      const artisans = await this.userService.fetchArtisans(
        service.data.title,
        details.placeId,
      );
      if (artisans?.data?.length) {
        await this.notificationService.createNotification(
          {
            type: 'Job',
            message: `There's an edited job request from ${user.firstName}`,
            title: 'Edited Job Notification',
            payload: job._id,
          },
          artisans.data,
          null,
          true,
        );
      }
      return ApiResponse.success('Job edited', HttpStatus.OK, updatedJob);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
  async deleteJob(user: UserDocument, jobId: Types.ObjectId) {
    try {
      const jobConditions = ['pending', 'completed'];
      const job = await this.jobModel.findOne({
        _id: jobId,
        createdBy: user._id,
      });
      if (!job) {
        return ApiResponse.fail(
          'Job does not exist',
          HttpStatus.NOT_FOUND,
          null,
        );
      }
      if (user.type !== 'admin') {
        if (!jobConditions.includes(job.status))
          return ApiResponse.fail(
            'This action cannot be completed',
            HttpStatus.BAD_REQUEST,
            null,
          );
      }
      if (job.images?.length > 0) {
        const imageIds: Types.ObjectId[] =
          job.images as unknown as Types.ObjectId[];
        await this.fileService.deleteFiles(imageIds);
      }
      await this.jobModel.deleteOne({ _id: job._id });
      return ApiResponse.success('Job deleted', HttpStatus.OK, null);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
  async apply(user: UserDocument, bidDetails: createBidDto) {
    try {
      const job = await this.jobModel
        .findById(bidDetails.job)
        .populate('service');
      if (!job)
        return ApiResponse.fail(
          'Job does not exist',
          HttpStatus.NOT_FOUND,
          null,
        );
      if (job.status !== 'pending')
        throw new Error('You cannot apply for this job');
      const existingBid = await this.bidModel.findOne({
        job: job._id,
        artisan: user._id,
        status: { $ne: 'rejected' },
      });
      if (existingBid)
        throw new Error('Sorry, you have already bidded for this job');
      if (!user.skills.includes(job.service))
        throw new Error(`A ${job.service} is required for this job`);
      const chatDetails = await this.chatService.sendMsg(
        user._id,
        [job.createdBy],
        `${user.firstName}, placed a bid for your ${job.service} job`,
        'info',
      );
      if (!chatDetails.status) return chatDetails;
      const bid = await this.bidModel.create({
        job: job._id,
        price: bidDetails.price,
        artisan: user._id,
        client: job.createdBy,
        chat: chatDetails.data.chat,
      });
      await this.notificationService.createNotification(
        {
          type: 'Message',
          message: `${user.firstName} has placed a bid for your ${job.service} job`,
          title: `New Message from ${user.firstName}`,
        },
        [bid.artisan],
        null,
        true,
      );
      return ApiResponse.success('Bid placed successfully', HttpStatus.OK, bid);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
  async fetchBids(chatId: string, page?: number, limit?: number) {
    try {
      const chat = new Types.ObjectId(chatId);
      return await paginateFunction(
        this.bidModel,
        page,
        limit,
        { path: 'job', select: 'service description address' },
        { chat },
        'createdAt',
        -1,
      );
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
  async updateBidStatus(user: UserDocument, bidDetails: UpdateBidDto) {
    try {
      const bid = await this.bidModel.findById(bidDetails.bidId);
      if (!bid)
        return ApiResponse.fail(
          'Bid does not exist',
          HttpStatus.NOT_FOUND,
          null,
        );
      if (bid.status === 'delivered') throw new Error('Bid cannot be updated');
      if (
        bidDetails?.status === 'rejected' &&
        user._id.toString() !== bid.client.toString()
      )
        throw new Error('Action cannot be completed by you');
      if (bidDetails.price && bid.status !== 'pending')
        throw new Error('Bid is not pending, price cannot be updated');
      if (bidDetails?.status === 'delivered') bid.dateDelivered = new Date();
      bid.price = bidDetails.price || bid.price;
      bid.status = bidDetails.status || bid.status;
      await bid.save();
      await this.chatService.sendMsg(
        bid.artisan,
        [bid.client],
        `${user.firstName} just updated the status of your ${bidDetails.status === 'rejected' ? '' : "job's"} bid to ${bid.status}`,
        'info',
      );
      await this.notificationService.createNotification(
        {
          type: 'Message',
          message: `${user.firstName} just updated the status of your ${bidDetails.status === 'rejected' ? '' : "job's"} bid to ${bid.status}`,
          title: 'Updated Bid',
        },
        [bidDetails.status === 'rejected' ? bid.artisan : bid.client],
        null,
        true,
      );
      return ApiResponse.success('Bid updated', HttpStatus.OK, bid);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
  //for the artisan
  async acceptJob(bidId: Types.ObjectId, user: UserDocument) {
    try {
      const bid = await this.bidModel.findOne({
        _id: bidId,
        artisan: user._id,
      });
      if (!bid) {
        return ApiResponse.fail(
          'Bid does not exist',
          HttpStatus.NOT_FOUND,
          null,
        );
      }
      if (bid.status !== 'accepted')
        throw new Error('Bid has not been accepted');
      const job = await this.jobModel.findById(bid.job);
      if (!job) {
        return ApiResponse.fail(
          'Job does not exist',
          HttpStatus.NOT_FOUND,
          null,
        );
      }
      if (job.bid) {
        throw new Error('This job has an accepted bid already');
      }

      const transaction = await this.walletService.transfer(
        bid.client,
        bid.artisan,
        bid.price,
        'Payment for job',
      );
      if (!transaction.status) {
        if (transaction.statusCode === 403) {
          await this.notificationService.createNotification(
            {
              type: 'Job',
              message: `Your ${job.service} job could not be accepted due to insufficent balance, Kindly top up your wallet`,
              title: 'Insufficient balance',
              payload: job._id,
            },
            [bid.client],
            null,
            true,
          );
          await this.chatService.sendMsg(
            bid.artisan,
            [bid.client],
            `Your ${job.service} job could not be accepted due to insufficent balance, Kindly top up your wallet`,
            'info',
          );
        }
        return transaction;
      }
      job.bid = bid._id;
      job.assignedTo = bid.artisan;
      job.price = bid.price;
      job.initialCharge = transaction?.data?.initialCharge;
      job.status = 'accepted';
      await job.save();
      console.log(job.assignedTo);
      bid.transaction = transaction?.data?.debitWalletHistory?._id;
      bid.status = 'in-progress';
      await bid.save();
      await this.bidModel.updateMany(
        { job: bid.job, _id: { $ne: bid._id } },
        { status: 'rejected' },
      );
      await this.chatService.sendMsg(
        bid.artisan,
        [bid.client],
        `${user.firstName} has accepted your ${job.service} job`,
        'info',
      );
      await this.notificationService.createNotification(
        {
          type: 'Job',
          message: `${user.firstName} has accepted your ${job.service} job`,
          title: 'Job Accepted',
          payload: job._id,
        },
        [bid.client],
        null,
        true,
      );
      return ApiResponse.success(
        'Job accepted successfully',
        HttpStatus.OK,
        bid,
      );
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
  async acceptBid(bidId: Types.ObjectId, userId: Types.ObjectId) {
    try {
      const bid = await this.bidModel.findOne({ _id: bidId, client: userId });
      if (!bid) {
        return ApiResponse.fail(
          'Bid does not exist',
          HttpStatus.NOT_FOUND,
          null,
        );
      }
      if (bid.status !== 'pending' && bid.status !== 'rejected')
        throw new Error('Bid cannot be accepted');
      const job = await this.jobModel.findById(bid.job);
      if (!job) {
        return ApiResponse.fail(
          'Job does not exist',
          HttpStatus.NOT_FOUND,
          null,
        );
      }
      if (job.bid) {
        throw new Error('This job has an accepted bid already');
      }
      const balanceDetails = await this.walletService.checkBalance(
        bid.price,
        userId,
      );
      if (!balanceDetails.status) return balanceDetails;
      bid.status = 'accepted';
      await bid.save();
      job.status = 'assigned';
      await job.save();
      await this.bidModel.updateMany(
        { job: bid.job, _id: { $ne: bid._id } },
        { status: 'rejected' },
      );
      await this.chatService.sendMsg(
        bid.client,
        [bid.artisan],
        `You have been awarded the ${job.service} job, kindly accept the job to receive your payment`,
        'info',
      );
      const { data } = await this.userService.getUser({ _id: userId });

      await this.notificationService.createNotification(
        {
          type: 'Chat',
          message: `You have a new message ${data?.firstName ? 'from ' + data?.firstName : ''}`,
          title: 'New Message',
        },
        [bid.artisan],
        null,
        true,
      );
      return ApiResponse.success(
        'Bid accepted successfully',
        HttpStatus.OK,
        bid,
      );
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
  async cancelBid(bidId: Types.ObjectId, user: UserDocument) {
    try {
      const bid = await this.bidModel.findOne({
        _id: bidId,
        artisan: user._id,
      });
      if (!bid) {
        return ApiResponse.fail('Job does not exist', HttpStatus.NOT_FOUND);
      }

      const job = await this.jobModel.findById(bid.job);
      if (!job)
        return ApiResponse.fail('Job does not exist', HttpStatus.NOT_FOUND);
      if (!job.bid) {
        bid.status = 'cancelled';
        await bid.save();
        return ApiResponse.success('Bid Cancelled', HttpStatus.OK, bid);
      }
      const transaction = await this.walletService.transferWithPenalty(
        bid.artisan,
        bid.client,
        job.price,
        'Cancelled Bid',
        job.initialCharge,
      );
      if (!transaction.status) return transaction;

      job.bid = undefined;
      job.assignedTo = undefined;
      job.price = undefined;
      job.status = 'pending';
      await job.save();
      bid.transaction = transaction?.data?.debitWalletHistory?._id;
      bid.status = 'cancelled';
      await bid.save();
      await this.chatService.sendMsg(
        bid.artisan,
        [bid.client],
        `${user.firstName} cancelled their bid for your ${job.service} job`,
        'info',
      );
      await this.notificationService.createNotification(
        {
          type: 'Job',
          message: `${user.firstName} cancelled their bid for your ${job.service} job`,
          title: 'Bid cancelled',
          payload: bid._id,
        },
        [bid.client],
        null,
        true,
      );
      const { data } = await this.servicesService.fetchService({
        title: job.service,
      });
      const artisans = await this.userService.fetchArtisans(
        data._id,
        job.address.placeId,
      );
      const { data: creator } = await this.userService.getUser({
        _id: job.createdBy,
      });
      if (artisans?.data?.length) {
        this.notificationService.createNotification(
          {
            type: 'Job',
            message: `There's a new job request ${creator?.firstName ? 'from ' + creator?.firstName : ''}`,
            title: 'New Job Notification',
            payload: job._id,
          },
          artisans.data,
          null,
          true,
        );
        return ApiResponse.success(
          'Cancelled bid successfully',
          HttpStatus.OK,
          bid,
        );
      }
      return ApiResponse.success('Bid Cancelled', HttpStatus.OK, bid);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
  async updateJobStatus(
    user: UserDocument,
    bidId: Types.ObjectId,
    status: string,
  ) {
    try {
      const notPermittedStatus = ['pending', 'assigned'];
      const bid = await this.bidModel.findById(bidId);
      if (!bid)
        return ApiResponse.fail(
          'Bid does not exist',
          HttpStatus.NOT_FOUND,
          null,
        );
      const job = await this.jobModel.findOne({
        _id: bid.job,
        createdBy: user._id,
      });
      if (!job)
        return ApiResponse.fail(
          'Job does not exist',
          HttpStatus.NOT_FOUND,
          null,
        );
      if (notPermittedStatus.includes(job.status))
        throw new Error('Job status cannot be updated');
      if (status === 'completed' && job.status !== 'completed') {
        const walletDetails = await this.walletService.transferToCurrentBalance(
          job.assignedTo,
          job.price,
          'Job completed',
          job.initialCharge,
        );
        if (!walletDetails.status) return walletDetails;
        await this.notificationService.createNotification(
          {
            type: 'Message',
            message: `${user.firstName} just funded your wallet`,
            title: 'Wallet',
          },
          [job.assignedTo],
          null,
          true,
        );
        const artisanDetails = await this.userService.getUser({
          _id: job.assignedTo,
        });
        if (artisanDetails.status) {
          const artisan: UserDocument = artisanDetails.data;
          artisan.projects += 1;
          await artisan.save();
        }
      }
      job.status = status;
      bid.status = status === 'completed' ? status : bid.status;
      await bid.save();
      await job.save();
      await this.notificationService.createNotification(
        {
          type: 'Job',
          message: `${user.firstName} just updated job status`,
          title: 'Wallet',
          payload: job._id,
        },
        [job.assignedTo],
        null,
        true,
      );
      return ApiResponse.success('Status updated', HttpStatus.OK, job);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
  async deleteUserJobs(userId: Types.ObjectId) {
    try {
      let acceptedJobs = await this.jobModel.find({
        createdBy: userId,
        status: { $ne: 'pending' },
      });
      if (!acceptedJobs) {
        await this.jobModel.find({
          assignedTo: userId,
          status: { $ne: 'pending' },
        });
      }
      if (acceptedJobs.length > 0)
        throw new Error(
          'Kindly complete all your jobs before carrying out this action',
        );
      await this.jobModel.deleteMany({ createdBy: userId });
      await this.bidModel.deleteMany({ artisan: userId });
      await this.bidModel.deleteMany({ client: userId });
      return ApiResponse.success('Jobs deleted', HttpStatus.OK, null);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async artisanSearch(
    page: number,
    limit: number,
    address?: string,
    service?: string,
  ) {
    try {
      const addressRegex = new RegExp(address, 'i');
      const serviceRegex = new RegExp(service, 'i');
      let filter = {};
      if (address) {
        filter = { 'address.location': addressRegex };
      }
      if (service) {
        filter = { ...filter, service: serviceRegex };
      }
      return await paginateFunction(
        this.jobModel,
        page,
        limit,
        [
          { path: 'createdBy', select: 'firstName lastName' },
          { path: 'images', select: 'url' },
          { path: 'assignedTo', select: 'firstName lastName' },
        ],
        filter,
      );
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
  async fetchJobNumbers() {
    try {
      const pending = await this.jobModel.countDocuments({ status: 'pending' });
      const completed = await this.jobModel.countDocuments({
        status: 'completed',
      });
      const accepted = await this.jobModel.countDocuments({
        status: 'accepted',
      });
      const all = await this.jobModel.countDocuments();
      return ApiResponse.success('Number of jobs', HttpStatus.OK, {
        pending,
        completed,
        accepted,
        all,
      });
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async jobNo(filter: any = {}) {
    return await this.jobModel.countDocuments(filter);
  }

  async searchJobs(searchString: string = '', status: string) {
    try {
      const filter = status && status !== 'null' ? { status } : {};
      const jobs = await this.jobModel
        .find(filter)
        .populate({
          path: 'createdBy',
          select: 'firstName lastName',
          match: {
            $or: [
              { firstName: { $regex: searchString, $options: 'i' } },
              { lastName: { $regex: searchString, $options: 'i' } },
            ],
          },
        })
        .populate({
          path: 'assignedTo',
          select: 'firstName lastName',
          match: {
            $or: [
              { firstName: { $regex: searchString, $options: 'i' } },
              { lastName: { $regex: searchString, $options: 'i' } },
            ],
          },
        })
        .populate({ path: 'images', select: 'url' });
      const filteredJobs = jobs.filter(
        (job) => job.createdBy || job?.assignedTo,
      );
      return ApiResponse.success('jobs', HttpStatus.OK, filteredJobs);
    } catch (error: any) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
}
