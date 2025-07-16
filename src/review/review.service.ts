import { InjectModel } from '@nestjs/mongoose';
import { Review } from './review.schema';
import { Model, Types } from 'mongoose';
import { ApiResponse } from '../utility/ApiResponse';
import { HttpStatus } from '@nestjs/common';
import { CreateReviewDto, UpdateReviewDto } from './review.dto';
import { UserService } from '../user/user.service';
import { UserDocument } from '../user/user.schema';

export class ReviewService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<Review>,
    private userService: UserService,
  ) {}

  async createReview(userId: Types.ObjectId, reviewDetails: CreateReviewDto) {
    try {
      const { data: user, ...userDetails } = await this.userService.getUser({
        _id: reviewDetails.userId,
      });
      if (!userDetails.status)
        return ApiResponse.fail(
          'User does not exist',
          HttpStatus.NOT_FOUND,
          null,
        );
      const review = await this.reviewModel.create({
        ...reviewDetails,
        user: user._id,
        reviewedBy: userId,
      });
      user.ratingNo += 1;
      user.ratingValue += +reviewDetails.rating;
      user.rating = (user.ratingValue / user.ratingNo).toFixed(1);
      await user.save();
      return ApiResponse.success('User Reviewed', HttpStatus.OK, review);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
  async fetchReviews(userId: Types.ObjectId) {
    try {
      const reviews = await this.reviewModel
        .find({ user: userId })
        .populate({
          path: 'user',
          select: 'firstName lastName avatar',
          populate: { path: 'avatar', select: 'url' },
        })
        .populate({
          path: 'reviewedBy',
          select: 'firstName lastName avatar',
          populate: { path: 'avatar', select: 'url' },
        });
      return ApiResponse.success('Reviews', HttpStatus.OK, reviews);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
  async deleteReviews(admin: UserDocument, reviewId: Types.ObjectId) {
    try {
      if (admin.type !== 'admin')
        throw new Error('Action cannot be completed by you');
      const review = await this.reviewModel.findOneAndDelete({ _id: reviewId });
      const { data: user, ...userDetails } = await this.userService.getUser({
        _id: review.user,
      });
      user.ratingNo -= 1;
      user.ratingValue -= review.rating;
      user.rating = (user.ratingValue / user.ratingNo).toFixed(1);
      await user.save();
      return ApiResponse.success('Review deleted', HttpStatus.OK, null);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
  async editReview(userId: Types.ObjectId, reviewDetails: UpdateReviewDto) {
    try {
      const { rating, content, reviewId } = reviewDetails;
      const review = await this.reviewModel.findOne({
        _id: reviewId,
        reviewedBy: userId,
      });
      if (!review)
        return ApiResponse.fail(
          'Review does not exist',
          HttpStatus.NOT_FOUND,
          null,
        );
      const { data: user, ...userDetails } = await this.userService.getUser(
        review.user,
      );
      if (!userDetails.status) throw new Error('User does not exist');
      user.ratingValue -= review.rating;
      user.ratingValue += rating || review.rating;
      user.rating = (user.ratingValue / user.ratingNo).toFixed(1);
      await user.save();
      review.content = content || review.content;
      review.rating = rating || review.rating;
      await review.save();
      return ApiResponse.success('Review Updated', HttpStatus.OK, review);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
}
