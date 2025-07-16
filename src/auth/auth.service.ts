import { Injectable, HttpStatus } from '@nestjs/common';
import { CreateUserDto, changePasswordDto } from './auth.dto';
import { TokenService } from './token/token.service';
import { UserService } from '../user/user.service';
import { mailService } from '../utility/mailer';
import { ApiResponse } from '../utility/ApiResponse';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { UserDocument } from '../user/user.schema';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class AuthService {
  constructor(
    private tokenService: TokenService,
    private userService: UserService,
    private notificationService: NotificationService,
    private jwtService: JwtService,
  ) {}

  async register(userData: CreateUserDto) {
    try {
      const { data: user, ...userResult } =
        await this.userService.createUser(userData);
      const { data: token, ...tokenResult } =
        await this.tokenService.createToken(user, 'verify-email');
      if (!userResult.status) return userResult;
      if (!tokenResult.status) return tokenResult;
      await mailService(
        user.email,
        'Verify Your Account',
        { user, token },
        'verify-email',
      );
      await this.notificationService.createNotification(
        {
          type: 'Message',
          message: 'Welcome to Talenter',
          title: 'Welcome Message',
        },
        [user._id],
        null,
        false,
      );
      return ApiResponse.success(
        'Kindly check your mail to verify your email',
        HttpStatus.OK,
        user,
      );
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async verifyEmail(token: string) {
    try {
      const verifiedEmail = await this.tokenService.verifyToken(
        token,
        'verify-email',
      );
      if (!verifiedEmail.status) return verifiedEmail;
      const user = verifiedEmail?.data?.user;
      const updatedUser = await this.userService.updateUser(user, {
        emailVerified: true,
      });
      if (!updatedUser.status) return updatedUser;
      return ApiResponse.success('Email Verified', HttpStatus.OK, null);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async requestResetPassword(email: string) {
    try {
      const { data: user, ...userDetails } = await this.userService.getUser({
        email,
      });
      if (!userDetails.status) return userDetails;
      const { data: token, ...tokenResult } =
        await this.tokenService.createToken(user, 'reset-password');
      if (!tokenResult.status) return tokenResult;
      await mailService(
        user.email,
        'Password Reset',
        { user, token },
        'reset-password',
      );
      return ApiResponse.success(
        'Kindly check your mail to reset password',
        HttpStatus.OK,
        null,
      );
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async resendEmailToken(email: string) {
    try {
      const { data: user, ...userDetails } = await this.userService.getUser({
        email,
      });
      if (!userDetails.status) return userDetails;
      const { data: token, ...tokenResult } =
        await this.tokenService.createToken(user, 'verify-email');
      if (!tokenResult.status) return tokenResult;
      await mailService(
        user.email,
        'Verify Your Account',
        { user, token },
        'verify-email',
      );
      return ApiResponse.success(
        'Kindly check your mail to verify your email',
        HttpStatus.OK,
        null,
      );
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async resetPassword(token: string, password: string) {
    try {
      const tokenResult = await this.tokenService.verifyToken(
        token,
        'reset-password',
      );
      if (!tokenResult.status) return tokenResult;
      const userId = tokenResult?.data?.user;
      const hashedPw = await bcrypt.hash(password, 12);
      const { data: user, ...updatedUser } = await this.userService.updateUser(
        userId,
        {
          password: hashedPw,
        },
      );
      if (!updatedUser.status) return updatedUser;
      await mailService(
        user.email,
        'Password Reset Sucessful',
        user,
        'reset-password-successful',
      );
      return ApiResponse.success(
        'Password reset successful',
        HttpStatus.OK,
        null,
      );
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async login(email: string, password: string) {
    try {
      const { data: user, ...userDetails } = await this.userService.getUser(
        { email },
        true,
      );
      if (!userDetails.status) return userDetails;
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword)
        return ApiResponse.fail(
          'Invalid Password',
          HttpStatus.UNAUTHORIZED,
          null,
        );
      if (!user.emailVerified) {
        return ApiResponse.fail(
          'Email not verified',
          HttpStatus.FORBIDDEN,
          null,
        );
      }
      user.lastLogin = new Date();
      await user.save();
      const access_token = this.jwtService.sign({
        username: user.email,
        sub: user._id,
      });
      const { password: usPass, ...rest } = user.toObject();
      return ApiResponse.success('Login Successful', HttpStatus.OK, {
        user: rest,
        access_token,
      });
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async changePassword(userDetails: UserDocument, data: changePasswordDto) {
    const { oldPassword, newPassword } = data;
    try {
      const userResult = await this.userService.getUser(
        { _id: userDetails._id },
        true,
      );
      if (!userResult.status) return userResult;
      const user = userResult.data;
      const validPassword = await bcrypt.compare(oldPassword, user.password);
      if (!validPassword)
        return ApiResponse.fail(
          'Invalid Password',
          HttpStatus.UNAUTHORIZED,
          null,
        );
      user.password = newPassword;
      await user.save();
      const { password, ...rest } = user.toObject();
      return ApiResponse.success(
        'Password reset successful',
        HttpStatus.OK,
        rest,
      );
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
}
