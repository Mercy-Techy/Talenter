import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserDocument } from '../../user/user.schema';
import { Token } from './token.schema';
import { Model } from 'mongoose';
import { ApiResponse } from '../../utility/ApiResponse';

@Injectable()
export class TokenService {
  constructor(@InjectModel(Token.name) private tokenModel: Model<Token>) {}

  tokenGenerator = (length: number) => {
    const chars = '0123456789';
    let code = '';
    for (let i = 0; i < length; i += 1) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };
  async generateToken(length: number) {
    try {
      let availableCode: any = false;
      do {
        const token = this.tokenGenerator(length);
        const code = await this.tokenModel.findOne({ token });
        if (!code) availableCode = token;
      } while (!availableCode);
      return availableCode;
    } catch (error) {
      console.log(error);
    }
  }

  async createToken(user: UserDocument, type: string, payload?: any) {
    try {
      const token = await this.generateToken(6);
      await this.tokenModel.deleteMany({ user: user._id, type });
      await this.tokenModel.create({
        user: user._id,
        type,
        token,
        payload,
        expireAt: new Date().getTime() + 60 * 60 * 1000,
      });
      return ApiResponse.success('Token created', HttpStatus.OK, token);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async verifyToken(token: string, type: string) {
    try {
      const tokenData = await this.tokenModel.findOne({ token, type });
      const now = new Date();
      console.log(tokenData.expireAt, now, tokenData.expireAt < now);
      if (!tokenData || tokenData.expired || tokenData.expireAt < now) {
        if (tokenData)
          await this.tokenModel.deleteMany({ user: tokenData.user, type });
        return ApiResponse.fail('Invalid Token', HttpStatus.UNAUTHORIZED, null);
      }

      await this.tokenModel.deleteMany({ user: tokenData.user, type });
      return ApiResponse.success('Token Verified', HttpStatus.OK, {
        user: tokenData.user,
        payload: tokenData.payload,
      });
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
}
