import {
  Controller,
  Get,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
  Post,
  Body,
  Res,
  Param,
  Query,
  Put,
  Delete,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiQuery,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiParam,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { AuthUser } from '../decorators/user.decorator';
import { ValidateArtisan } from '../guards/validateArtisan.guard';
import { ValidateClient } from '../guards/validateClient.guard';
import { JwtAuthGuard } from '../guards/auth.guard';
import { UserDocument } from '../user/user.schema';
import { JobService } from './job.service';
import {
  CreateJobDto,
  createBidDto,
  createJobBody,
  paramJobId,
  updateJobBody,
  UpdateBidDto,
  UpdateJobDto,
} from './job.dto';
import { ValidationPipe } from '@nestjs/common';
import { Types } from 'mongoose';
import { response } from '../utility/ApiResponse';
import { Response } from 'express';

@ApiTags('Jobs')
@ApiBearerAuth()
@ApiBadRequestResponse()
@ApiOkResponse()
@UseGuards(JwtAuthGuard)
@Controller('jobs')
export class JobController {
  constructor(private jobService: JobService) {}

  @UseInterceptors(FileFieldsInterceptor([{ name: 'jobImages', maxCount: 5 }]))
  @ApiBody(createJobBody)
  @ApiConsumes('multipart/form-data')
  @UseGuards(ValidateClient)
  @Post()
  async createJob(
    @UploadedFiles()
    jobImages: {
      jobImages: Express.Multer.File[];
    },
    @AuthUser() user: UserDocument,
    @Body(new ValidationPipe()) jobDetails: CreateJobDto,
    @Res() res: Response,
  ) {
    return response(
      res,
      await this.jobService.createJob(jobDetails, user, jobImages.jobImages),
    );
  }

  @ApiNotFoundResponse()
  @ApiParam({ name: 'jobId', type: 'string', required: true })
  @Get('fetch-job/:jobId')
  async fetchJob(
    @Res() res: Response,
    @Param('jobId') jobId: Types.ObjectId,
    @AuthUser('_id') userId: Types.ObjectId,
  ) {
    return response(
      res,
      await this.jobService.fetchJob({ _id: jobId }, userId),
    );
  }

  @ApiQuery({ name: 'page', type: 'number', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @Get('fetch-created-jobs')
  async fetchCreatedJobs(
    @AuthUser('_id') userId: Types.ObjectId,
    @Res() res: Response,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return response(
      res,
      await this.jobService.fetchJobs(
        { createdBy: userId },
        page,
        limit,
        userId,
      ),
    );
  }

  @UseGuards(ValidateArtisan)
  @ApiQuery({ name: 'page', type: 'number', required: false })
  @Get('fetch-close-jobs')
  async fetchCloseJobs(
    @AuthUser() user: UserDocument,
    @Res() res: Response,
    @Query('page') page: number,
  ) {
    return response(res, await this.jobService.fetchcloseJobs(user, page));
  }

  @UseGuards(ValidateArtisan)
  @ApiParam({ name: 'jobId', type: 'string', required: true })
  @Post('save-job/:jobId')
  async saveJob(
    @AuthUser('_id') userId: Types.ObjectId,
    @Param('jobId') jobId: Types.ObjectId,
    @Res() res: Response,
  ) {
    return response(res, await this.jobService.saveJob(userId, jobId));
  }

  @UseGuards(ValidateArtisan)
  @ApiParam({ name: 'jobId', type: 'string', required: true })
  @Post('unsave-job/:jobId')
  async unSaveJob(
    @AuthUser('_id') userId: Types.ObjectId,
    @Param('jobId') jobId: Types.ObjectId,
    @Res() res: Response,
  ) {
    return response(res, await this.jobService.unSaveJob(userId, jobId));
  }

  @ApiQuery({ name: 'page', type: 'number', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @Get('fetch-saved-jobs')
  async fetchJobs(
    @AuthUser('_id') userId: Types.ObjectId,
    @Res() res: Response,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return response(
      res,
      await this.jobService.fetchJobs(
        {
          savedBy: { $in: [userId] },
          status: { $ne: 'completed' },
        },
        page,
        limit,
        userId,
      ),
    );
  }

  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'jobImages', maxCount: 5 }]))
  @ApiBody(updateJobBody)
  @ApiNotFoundResponse()
  @Put('edit-job')
  async editJob(
    @AuthUser() user: UserDocument,
    @Body('jobId') jobId: Types.ObjectId,
    @Body(new ValidationPipe()) details: CreateJobDto,
    @UploadedFiles()
    jobImages: {
      jobImages: Express.Multer.File[];
    },
    @Res() res: Response,
  ) {
    return response(
      res,
      await this.jobService.editJob(user, jobId, details, jobImages.jobImages),
    );
  }

  @ApiParam(paramJobId)
  @ApiNotFoundResponse()
  @Delete(':jobId')
  async deleteJob(
    @AuthUser() user: UserDocument,
    @Param('jobId') jobId: Types.ObjectId,
    @Res() res: Response,
  ) {
    return response(res, await this.jobService.deleteJob(user, jobId));
  }

  @Post('apply-for-job')
  @UseGuards(ValidateArtisan)
  async applyForJob(
    @AuthUser() user: UserDocument,
    @Res() res: Response,
    @Body(new ValidationPipe({ whitelist: true })) bidDetails: createBidDto,
  ) {
    return response(res, await this.jobService.apply(user, bidDetails));
  }

  @ApiParam({ name: 'chatId', type: 'string', required: true })
  @ApiQuery({ name: 'page', type: 'number', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @Get('fetch-bids/:chatId')
  async fetchBids(
    @Param('chatId') chatId: string,
    @Res() res: Response,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return response(res, await this.jobService.fetchBids(chatId, page, limit));
  }

  @ApiNotFoundResponse()
  @Post('update-bid')
  async updateBid(
    @Body(new ValidationPipe({ whitelist: true })) bidDetails: UpdateBidDto,
    @Res() res: Response,
    @AuthUser() user: UserDocument,
  ) {
    return response(
      res,
      await this.jobService.updateBidStatus(user, bidDetails),
    );
  }

  @ApiNotFoundResponse()
  @ApiParam({ name: 'bidId', type: 'string', required: true })
  @Post('accept-bid/:bidId')
  @UseGuards(ValidateClient)
  async acceptBid(
    @Res() res: Response,
    @AuthUser('_id') userId: Types.ObjectId,
    @Param('bidId') bidId: Types.ObjectId,
  ) {
    return response(res, await this.jobService.acceptBid(bidId, userId));
  }

  @ApiNotFoundResponse()
  @ApiParam({ name: 'bidId', type: 'string', required: true })
  @Post('accept-job/:bidId')
  @UseGuards(ValidateArtisan)
  async acceptJob(
    @Res() res: Response,
    @AuthUser() user: UserDocument,
    @Param('bidId') bidId: Types.ObjectId,
  ) {
    return response(res, await this.jobService.acceptJob(bidId, user));
  }

  @ApiNotFoundResponse()
  @ApiParam({ name: 'bidId', type: 'string', required: true })
  @Post('cancel-job/:bidId')
  @UseGuards(ValidateArtisan)
  async cancelBid(
    @Res() res: Response,
    @AuthUser() user: UserDocument,
    @Param('bidId') bidId: Types.ObjectId,
  ) {
    return response(res, await this.jobService.cancelBid(bidId, user));
  }

  @ApiNotFoundResponse()
  @UseGuards(ValidateClient)
  @Post('update-job-status')
  async updateJobStatus(
    @Res() res: Response,
    @AuthUser() user: UserDocument,
    @Body() updateDetails: UpdateJobDto,
  ) {
    return response(
      res,
      await this.jobService.updateJobStatus(
        user,
        updateDetails.bidId,
        updateDetails.status,
      ),
    );
  }

  @ApiQuery({ name: 'page', type: 'number', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @ApiQuery({ name: 'address', type: 'string', required: false })
  @ApiQuery({ name: 'service', type: 'string', required: false })
  @Get('artisan-search')
  async artisanSearch(
    @Res() res: Response,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('address') address: string,
    @Query('service') service: string,
  ) {
    return response(
      res,
      await this.jobService.artisanSearch(page, limit, address, service),
    );
  }
}
