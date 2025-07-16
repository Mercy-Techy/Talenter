import {
  Controller,
  Delete,
  Param,
  Post,
  Get,
  UseGuards,
  Res,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { NotificationService } from './notification.service';
import { AuthUser } from '../decorators/user.decorator';
import { JwtAuthGuard } from '../guards/auth.guard';
import { UserDocument } from '../user/user.schema';
import { Response } from 'express';
import { response } from '../utility/ApiResponse';

@ApiTags('Notifications')
@ApiBadRequestResponse()
@ApiOkResponse()
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  @ApiQuery({ name: 'page', type: 'number', example: 1, required: false })
  @ApiQuery({ name: 'limit', type: 'number', example: 1, required: false })
  async fetchNotifications(
    @AuthUser('_id') userId: Types.ObjectId,
    @Res() res: Response,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return response(
      res,
      await this.notificationService.fetchNotifications(userId, page, limit),
    );
  }
  @ApiNotFoundResponse()
  @ApiParam({ name: 'notificationId', type: 'string', required: true })
  @Post('mark-as-read/:notificationId')
  async markAsRead(
    @AuthUser('_id') userId: Types.ObjectId,
    @Param('notificationId') notificationId: Types.ObjectId,
    @Res() res: Response,
  ) {
    return response(
      res,
      await this.notificationService.markNotificationAsRead(
        userId,
        notificationId,
      ),
    );
  }

  @ApiParam({ name: 'notificationId', type: 'string', required: true })
  @Delete('/:notificationId')
  async deleteNotification(
    @Param('notificationId') notificationId: Types.ObjectId,
    @AuthUser() user: UserDocument,
    @Res() res: Response,
  ) {
    return response(
      res,
      await this.notificationService.deleteNotification(notificationId, user),
    );
  }
}
