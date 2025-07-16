import {
  Controller,
  Get,
  UseGuards,
  Post,
  Body,
  Res,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthUser } from '../decorators/user.decorator';
import { JwtAuthGuard } from '../guards/auth.guard';
import { Response } from 'express';
import { Types } from 'mongoose';
import { response } from '../utility/ApiResponse';
import { TransactionService } from './transaction.service';
import { UserDocument } from '../user/user.schema';
import { FundWalletDto, WithDrawDto } from './transaction.dto';

@ApiTags('Transaction')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiOkResponse()
@ApiBadRequestResponse()
@Controller('transaction')
export class TransactionController {
  constructor(private transactionService: TransactionService) {}
  @Post('withdraw')
  async withdraw(
    @Res() res: Response,
    @AuthUser() user: UserDocument,
    @Body(new ValidationPipe({ whitelist: true }))
    withdrawalDetails: WithDrawDto,
  ) {
    return response(
      res,
      await this.transactionService.withdraw(
        user,
        withdrawalDetails.bankId,
        withdrawalDetails.amount,
        withdrawalDetails.reason,
        withdrawalDetails.pin,
      ),
    );
  }

  @Post('fund')
  async fund(
    @Res() res: Response,
    @AuthUser() user: UserDocument,
    @Body(new ValidationPipe({ whitelist: true }))
    fundDetails: FundWalletDto,
  ) {
    return response(
      res,
      await this.transactionService.fundWallet(user, fundDetails.reference),
    );
  }

  @Get('reference')
  async fetchReference(@Res() res: Response) {
    return response(res, await this.transactionService.fetchReference());
  }
}
