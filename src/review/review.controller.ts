import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Res,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ReviewService } from './review.service';
import { response } from '../utility/ApiResponse';
import { AuthUser } from '../decorators/user.decorator';
import { Types } from 'mongoose';
import { CreateReviewDto, UpdateReviewDto } from './review.dto';
import { UserDocument } from '../user/user.schema';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/auth.guard';

@ApiTags('Reviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOkResponse()
@ApiBadRequestResponse()
@Controller('reviews')
export class ReviewController {
  constructor(private reviewService: ReviewService) {}

  @Post('create-review')
  async createReview(
    @Res() res: Response,
    @AuthUser('_id') userId: Types.ObjectId,
    @Body(new ValidationPipe({ whitelist: true }))
    reviewDetails: CreateReviewDto,
  ) {
    return response(
      res,
      await this.reviewService.createReview(userId, reviewDetails),
    );
  }

  @Get(':userId')
  @ApiParam({ name: 'userId', required: true, type: 'string' })
  async fetchReviews(
    @Res() res: Response,
    @Param('userId') userId: Types.ObjectId,
  ) {
    return response(res, await this.reviewService.fetchReviews(userId));
  }

  @Delete(':reviewId')
  @ApiParam({ name: 'reviewId', required: true, type: 'string' })
  async deleteReview(
    @Res() res: Response,
    @AuthUser() user: UserDocument,
    @Param('reviewId') reviewId: Types.ObjectId,
  ) {
    return response(
      res,
      await this.reviewService.deleteReviews(user, reviewId),
    );
  }
  @Put('edit')
  async editReview(
    @Res() res: Response,
    @AuthUser('_id') userId: Types.ObjectId,
    @Body(new ValidationPipe({ whitelist: true }))
    reviewDetails: UpdateReviewDto,
  ) {
    return response(
      res,
      await this.reviewService.editReview(userId, reviewDetails),
    );
  }
}
