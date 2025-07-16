import { Controller, Get, UseGuards, Res, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/auth.guard';
import { AuthUser } from '../decorators/user.decorator';
import { UserDocument } from '../user/user.schema';
import { Types } from 'mongoose';
import { WalletService } from './wallet.service';
import { response } from '../utility/ApiResponse';
import { Response } from 'express';

@ApiTags('Wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiOkResponse()
@ApiBadRequestResponse()
@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}
  @Get()
  async getWallet(
    @AuthUser('_id') userId: Types.ObjectId,
    @Res() res: Response,
  ) {
    return response(res, await this.walletService.getWallet(userId));
  }

  @ApiBody({
    schema: { properties: { pin: { type: 'string', example: '1234' } } },
  })
  @Post('initiate-set-transaction-pin')
  async initiateSetTransactionPin(
    @AuthUser() user: UserDocument,
    @Res() res: Response,
    @Body('pin') pin: string,
  ) {
    return response(
      res,
      await this.walletService.initiateSetTransactionPin(user, pin),
    );
  }

  @ApiBody({
    schema: { properties: { token: { type: 'string', example: '123456' } } },
  })
  @Post('set-transaction-pin')
  async setTransactionPin(@Res() res: Response, @Body('token') token: string) {
    return response(res, await this.walletService.setTransactionPin(token));
  }
}
