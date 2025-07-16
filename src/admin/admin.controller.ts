import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
  ValidationPipe,
  Put,
  UseInterceptors,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiConsumes,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../guards/auth.guard';
import { response } from '../utility/ApiResponse';
import { AuthUser } from '../decorators/user.decorator';
import { Types } from 'mongoose';
import { AdminService } from './admin.service';
import { ValidateAdmin } from '../guards/validateAdmin.guard';
import {
  AddAdminDto,
  SendMailDto,
  SendNotificationDto,
  UpdateUserStatusDto,
} from './admin.dto';
import { UserDocument } from '../user/user.schema';
import { TransactionService } from '../transaction/transaction.service';
import { JobService } from '../Job/job.service';

@ApiTags('Admin')
@ApiBearerAuth()
@ApiBadRequestResponse()
@ApiOkResponse()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private transactionService: TransactionService,
    private jobService: JobService,
  ) {}

  @ApiQuery({ name: 'page', type: 'number', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @UseGuards(ValidateAdmin)
  @Get('admins')
  async fetchAdmins(
    @Res() res: Response,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return response(res, await this.adminService.fetchAdmins(page, limit));
  }

  @Get('settings')
  async fetchSettings(@Res() res: Response) {
    return response(res, await this.adminService.fetchSettings());
  }

  @ApiQuery({ name: 'page', type: 'number', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @ApiQuery({ name: 'status', type: 'string', required: false })
  @ApiQuery({ name: 'type', type: 'string', required: false })
  @UseGuards(ValidateAdmin)
  @Get('users')
  async getUsers(
    @Res() res: Response,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('status') status: string,
    @Query('type') type: string,
  ) {
    let filter = {};
    if (status) filter = { status };
    if (type) filter = { ...filter, type };
    return response(
      res,
      await this.adminService.fetchUsers(filter, page, limit),
    );
  }

  @ApiQuery({ name: 'searchString', type: 'string', required: false })
  @ApiQuery({ name: 'status', type: 'string', required: false })
  @UseGuards(ValidateAdmin)
  @Get('search-users')
  async searchUsers(
    @Res() res: Response,
    @Query('searchString') searchString: string,
    @Query('status') status: string,
  ) {
    return response(
      res,
      await this.adminService.searchUsers(searchString, status),
    );
  }

  @ApiQuery({ name: 'status', type: 'string', required: false })
  @ApiQuery({ name: 'searchString', type: 'string', required: false })
  @UseGuards(ValidateAdmin)
  @Get('search-jobs')
  async searchJobs(
    @Res() res: Response,
    @Query('searchString') searchString: string,
    @Query('status') status: string,
  ) {
    return response(
      res,
      await this.jobService.searchJobs(searchString, status),
    );
  }

  @ApiQuery({ name: 'searchString', type: 'string', required: false })
  @UseGuards(ValidateAdmin)
  @Get('search-admins')
  async searchAdmins(
    @Res() res: Response,
    @Query('searchString') searchString: string,
  ) {
    return response(res, await this.adminService.searchAdmins(searchString));
  }

  @UseGuards(ValidateAdmin)
  @Post('send-email')
  async sendEmail(
    @Res() res: Response,
    @Body(new ValidationPipe({ whitelist: true })) mailDetails: SendMailDto,
  ) {
    return response(res, await this.adminService.sendEmail(mailDetails));
  }

  @UseGuards(ValidateAdmin)
  @Post('send-notification')
  async sendNotification(
    @Res() res: Response,
    @Body(new ValidationPipe({ whitelist: true }))
    notificationDetails: SendNotificationDto,
  ) {
    return response(
      res,
      await this.adminService.sendNotification(notificationDetails),
    );
  }

  @UseGuards(ValidateAdmin)
  @Post('update-user-status')
  async updateUser(
    @Body(new ValidationPipe({ whitelist: true }))
    { userId, status }: UpdateUserStatusDto,
    @Res() res: Response,
  ) {
    return response(
      res,
      await this.adminService.updateUserStatus(userId, status),
    );
  }

  @ApiQuery({ name: 'page', type: 'number', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @ApiQuery({ name: 'admin', type: 'string', required: false })
  @UseGuards(ValidateAdmin)
  @Get('transactions')
  async fetchTransactions(
    @Res() res: Response,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('admin') admin: string,
  ) {
    return response(
      res,
      await this.adminService.fetchTransactions(page, limit, admin),
    );
  }
  @ApiQuery({ name: 'searchString', type: 'string', required: false })
  @UseGuards(ValidateAdmin)
  @Get('search-transactions')
  async serchTransactions(
    @Res() res: Response,
    @Query('searchString') searchString: string,
  ) {
    return response(
      res,
      await this.transactionService.searchTransactions(searchString),
    );
  }

  @ApiQuery({ name: 'page', type: 'number', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @ApiQuery({ name: 'status', type: 'string', required: false })
  @UseGuards(ValidateAdmin)
  @Get('jobs')
  async fetchJobs(
    @Res() res: Response,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('status') status: string,
  ) {
    let filter = {};
    if (status) filter = { status };
    return response(
      res,
      await this.adminService.fetchJobs(filter, page, limit),
    );
  }

  @UseGuards(ValidateAdmin)
  @Get('jobs-numbers')
  async fetchJobsNumbers(@Res() res: Response) {
    return response(res, await this.adminService.fetchJobsNumbers());
  }

  @UseGuards(ValidateAdmin)
  @Get('users-numbers')
  async fetchUsersNumbers(@Res() res: Response) {
    return response(res, await this.adminService.fetchUsersNumbers());
  }

  @UseGuards(ValidateAdmin)
  @Get('dashboard-data')
  async fetchDashBoardData(@Res() res: Response) {
    return response(res, await this.adminService.dashBoardData());
  }

  @ApiBody({
    required: true,
    type: 'object',
    schema: { properties: { update: { example: { chargeFee: 100 } } } },
  })
  @UseGuards(ValidateAdmin)
  @Post('update-settings')
  async updateSettings(@Res() res: Response, @Body('update') update: any) {
    return response(res, await this.adminService.updateSettings(update));
  }

  @UseGuards(ValidateAdmin)
  @Post('add-admin')
  async addAdmin(
    @Res() res: Response,
    @AuthUser() admin: UserDocument,
    @Body(new ValidationPipe({ whitelist: true })) adminDetails: AddAdminDto,
  ) {
    return response(res, await this.adminService.addAdmin(adminDetails, admin));
  }

  @ApiBody({
    required: true,
    type: 'object',
    schema: {
      properties: {
        update: { example: { firstName: 'Bayo' } },
        adminId: { example: '663a2cc7c5a5a2e59172cd15' },
      },
    },
  })
  @ApiNotFoundResponse()
  @UseGuards(ValidateAdmin)
  @Put('edit-admin')
  async editAdmin(
    @Res() res: Response,
    @AuthUser() admin: UserDocument,
    @Body('update') update: any,
    @Body('adminId') adminId: Types.ObjectId,
  ) {
    return response(
      res,
      await this.adminService.editAdmin(adminId, update, admin),
    );
  }

  @ApiParam({ name: 'adminId', required: true, type: 'string' })
  @UseGuards(ValidateAdmin)
  @Delete('delete-admin/:adminId')
  async deleteAdmin(
    @Res() res: Response,
    @Param('adminId') userId: Types.ObjectId,
    @AuthUser() admin: UserDocument,
  ) {
    return response(res, await this.adminService.deleteAdmin(userId, admin));
  }
}
