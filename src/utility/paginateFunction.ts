import { Model } from 'mongoose';
import { ApiResponse } from './ApiResponse';
import { HttpStatus } from '@nestjs/common';

export default async (
  model: Model<any>,
  page: number = 1,
  limit: number = 10,
  populate: any = null,
  filter: any = {},
  sortField: any = null,
  sortFilter: any = null,
) => {
  try {
    const skip = (page - 1) * limit;
    const totalItems = await model.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);
    let data = await model
      .find(filter)
      .populate(populate)
      .skip(skip)
      .limit(limit)
      .exec();
    if (sortField) {
      data = await model
        .find(filter)
        .populate(populate)
        .sort({ [sortField]: sortFilter })
        .skip(skip)
        .limit(limit)
        .exec();
    }
    return ApiResponse.success(`Data`, HttpStatus.OK, {
      totalItems,
      totalPages,
      data,
    });
  } catch (error) {
    return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
  }
};
