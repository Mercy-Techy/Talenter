import { HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';

export class ApiResponse {
  constructor(
    public message: string,
    public status: boolean,
    public statusCode: number,
    public data?: any,
    public error?: Error,
  ) {}

  public static success(
    message: string,
    statusCode: number = HttpStatus.OK,
    data?: any,
  ): ApiResponseType {
    return new ApiResponse(message, true, statusCode, data);
  }

  public static fail(
    message: string,
    statusCode: number = HttpStatus.BAD_REQUEST,
    error?: any,
  ): ApiResponseType {
    return new ApiResponse(message, false, statusCode, null, error);
  }
}

export interface ApiResponseType {
  statusCode: number;
  status?: boolean;
  message: string;
  data?: any;
  error?: any;
}

export const response = (res: Response, details: ApiResponseType) => {
  return res.status(details.statusCode).json(details);
};
