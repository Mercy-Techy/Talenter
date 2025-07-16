import {
  Controller,
  Post,
  Body,
  HttpStatus,
  Req,
  UseGuards,
  HttpCode,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { CreateUserDto, LoginDto, changePasswordDto } from './auth.dto';
import { AuthService } from './auth.service';
import { ResetPasswordDto } from './auth.dto';
import { JwtAuthGuard } from '../guards/auth.guard';
import { AuthUser } from '../decorators/user.decorator';
import { User, UserDocument } from '../user/user.schema';
import { ValidationPipe } from '@nestjs/common';
import { response } from '../utility/ApiResponse';

@ApiTags('Auth')
@ApiOkResponse()
@ApiBadRequestResponse()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('/register')
  async register(
    @Body(new ValidationPipe({ whitelist: true })) userData: CreateUserDto,
    @Res() res: Response,
  ) {
    return response(res, await this.authService.register(userData));
  }

  @ApiUnauthorizedResponse()
  @ApiBody({
    schema: { properties: { token: { type: 'string', example: '123456' } } },
  })
  @Post('/verify-email')
  async verifyEmail(@Body('token') token: string, @Res() res: Response) {
    return response(res, await this.authService.verifyEmail(token));
  }

  @ApiNotFoundResponse()
  @ApiBody({
    schema: {
      properties: { email: { type: 'string', example: 'mercy@gmail.com' } },
    },
  })
  @Post('/resend-email-token')
  async resendEmailToken(@Body('email') email: string, @Res() res: Response) {
    return response(res, await this.authService.resendEmailToken(email));
  }

  @ApiNotFoundResponse()
  @ApiBody({
    schema: {
      properties: { email: { type: 'string', example: 'mercy@gmail.com' } },
    },
  })
  @Post('/request-reset-password')
  async requestResetPassword(
    @Body('email') email: string,
    @Res() res: Response,
  ) {
    return response(res, await this.authService.requestResetPassword(email));
  }

  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse()
  @Post('reset-password')
  async resetPassword(
    @Body(new ValidationPipe({ whitelist: true })) data: ResetPasswordDto,
    @Res() res: Response,
  ) {
    return response(
      res,
      await this.authService.resetPassword(data.token, data.password),
    );
  }

  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse()
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Email not verified, Kindly take user to verification page',
  })
  @Post('/login')
  async login(
    @Body(new ValidationPipe({ whitelist: true })) loginDetails: LoginDto,
    @Res() res: Response,
  ) {
    return response(
      res,
      await this.authService.login(loginDetails.email, loginDetails.password),
    );
  }

  @ApiUnauthorizedResponse()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('/change-password')
  async changePassword(
    @AuthUser() user: UserDocument,
    @Body(new ValidationPipe({ whitelist: true })) data: changePasswordDto,
    @Res() res: Response,
  ) {
    return response(res, await this.authService.changePassword(user, data));
  }
}
