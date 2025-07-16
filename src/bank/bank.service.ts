import { HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';
import { ApiResponse } from '../utility/ApiResponse';
import { GetAccountName } from './bank.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Bank } from './bank.schema';
import { Model, Types } from 'mongoose';
import { UserDocument } from '../user/user.schema';
import { PaystackService } from '../paystack/paystack.service';

@Injectable()
export class BankService {
  constructor(
    private paystackService: PaystackService,
    @InjectModel(Bank.name) private bankModel: Model<Bank>,
  ) {}
  async fetchBanks() {
    try {
      const banks = await this.paystackService.fetchBanks();
      return ApiResponse.success('Banks', HttpStatus.OK, banks);
    } catch (error) {
      return ApiResponse.fail(
        error?.response?.data?.message || error.message,
        HttpStatus.BAD_REQUEST,
        error,
      );
    }
  }

  async searchBanks(text: string) {
    try {
      const banks = await this.paystackService.fetchBanks(text);
      return ApiResponse.success('Banks', HttpStatus.OK, banks);
    } catch (error) {
      return ApiResponse.fail(
        error?.response?.data?.message || error.message,
        HttpStatus.BAD_REQUEST,
        error,
      );
    }
  }

  async addBank(user: UserDocument, accountDetails: GetAccountName) {
    try {
      const accountName = await this.paystackService.getAccountName(
        accountDetails.accountNumber,
        accountDetails.bankCode,
      );
      const existingBank = await this.bankModel.findOne({
        accountNumber: accountDetails.accountNumber,
      });
      if (existingBank) throw new Error('Bank exists already');
      const bank = await this.bankModel.create({
        ...accountDetails,
        accountName,
        user: user._id,
      });
      return ApiResponse.success('Bank added', HttpStatus.OK, bank);
    } catch (error) {
      return ApiResponse.fail(
        error?.response?.data?.message || error.message,
        HttpStatus.BAD_REQUEST,
        error,
      );
    }
  }
  async deleteBank(user: Types.ObjectId, bankId: Types.ObjectId) {
    try {
      const bank = await this.bankModel.findOneAndDelete({ _id: bankId, user });
      if (!bank)
        return ApiResponse.fail(
          'Bank does not exist',
          HttpStatus.NOT_FOUND,
          null,
        );
      return ApiResponse.success('Connected bank deleted', HttpStatus.OK, null);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async fetchConnectedBanks(user: Types.ObjectId) {
    try {
      const banks = await this.bankModel.find({ user });
      return ApiResponse.success('Connected banks', HttpStatus.OK, banks);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async fetchConnectedBank(user: Types.ObjectId, bankId: Types.ObjectId) {
    try {
      const bank = await this.bankModel.findOne({ user, _id: bankId });
      if (!bank)
        return ApiResponse.fail(
          'Bank does not exist',
          HttpStatus.NOT_FOUND,
          null,
        );
      return ApiResponse.success('Connected banks', HttpStatus.OK, bank);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
}
