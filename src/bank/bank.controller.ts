import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiParam,
  ApiNotFoundResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../guards/auth.guard';
import { response } from '../utility/ApiResponse';
import { BankService } from './bank.service';
import { GetAccountName } from './bank.dto';
import { AuthUser } from '../decorators/user.decorator';
import { UserDocument } from '../user/user.schema';
import { Types } from 'mongoose';

@ApiTags('Bank')
@ApiBearerAuth()
@ApiBadRequestResponse()
@ApiOkResponse()
@UseGuards(JwtAuthGuard)
@Controller('bank')
export class BankController {
  constructor(private bankService: BankService) {}
  @Get()
  async fetchBanks(@Res() res: Response) {
    return response(res, await this.bankService.fetchBanks());
  }

  @ApiQuery({ name: 'text', type: 'string', required: false })
  @Get('search')
  async searchBanks(@Res() res: Response, @Query('text') text: string) {
    return response(res, await this.bankService.searchBanks(text));
  }

  @Post('add-bank')
  async addBank(
    @Res() res: Response,
    @Body(new ValidationPipe({ whitelist: true }))
    accountDetails: GetAccountName,
    @AuthUser() user: UserDocument,
  ) {
    return response(res, await this.bankService.addBank(user, accountDetails));
  }

  @ApiNotFoundResponse()
  @ApiParam({ name: 'bankId', type: 'string', required: true })
  @Delete(':bankId')
  async deleteConnectedBank(
    @Res() res: Response,
    @AuthUser('_id') userId: Types.ObjectId,
    @Param('bankId') bankId: Types.ObjectId,
  ) {
    return response(res, await this.bankService.deleteBank(userId, bankId));
  }

  @Get('connected-banks')
  async fetchConnectedBanks(
    @Res() res: Response,
    @AuthUser('_id') userId: Types.ObjectId,
  ) {
    return response(res, await this.bankService.fetchConnectedBanks(userId));
  }
}
