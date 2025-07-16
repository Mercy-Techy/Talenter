import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Wallet } from './wallet.schema';
import { Model, Types } from 'mongoose';
import { ApiResponse } from '../utility/ApiResponse';
import { WalletHistory } from './walletHistory.schema';
import { Settings } from '../admin/settings.schema';
import { UserDocument } from '../user/user.schema';
import { TokenService } from '../auth/token/token.service';
import { mailService } from '../utility/mailer';
import { hashSync } from 'bcryptjs';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
    @InjectModel(Settings.name) private settingsModel: Model<Settings>,
    @InjectModel(WalletHistory.name)
    private walletHistoryModel: Model<WalletHistory>,
    private tokenService: TokenService,
  ) {}
  async createWallet(owner: Types.ObjectId) {
    try {
      const wallet = await this.walletModel.create({ owner });
      return ApiResponse.success('Wallet created', HttpStatus.OK, wallet);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
  async getWallet(userId: Types.ObjectId) {
    try {
      let wallet = await this.walletModel.findOne({ owner: userId });
      if (!wallet) {
        wallet = await this.walletModel.create({ owner: userId });
      }
      const walletHistories = await this.walletHistoryModel
        .find({
          user: userId,
          wallet: wallet._id,
        })
        .sort({ createdAt: -1 });
      return ApiResponse.success('Wallet', HttpStatus.OK, {
        wallet,
        walletHistories,
      });
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async checkBalance(amount: number, owner: Types.ObjectId) {
    try {
      let wallet = await this.walletModel.findOne({ owner });
      if (!wallet) wallet = await this.walletModel.create({ owner });
      if (wallet.currentBalance < amount) {
        throw new Error(
          `Your balance of #${wallet.currentBalance} is less than #${amount}. Please top up your wallet`,
        );
      }
      return ApiResponse.success(
        `Your balance of #${wallet.currentBalance} is greater than #${amount}.`,
        HttpStatus.OK,
        wallet.currentBalance,
      );
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
  async transfer(
    debitAccount: Types.ObjectId,
    creditAccount: Types.ObjectId,
    amount: number,
    description: string,
  ) {
    try {
      const settings = await this.settingsModel.findOne();
      const charge = settings.commissionPercent || 0;
      let debitWallet = await this.walletModel.findOne({ owner: debitAccount });
      let creditWallet = await this.walletModel.findOne({
        owner: creditAccount,
      });
      let adminWallet = await this.walletModel.findOne({
        owner: settings.admin,
      });
      if (!adminWallet)
        adminWallet = await this.walletModel.create({ owner: settings.admin });
      if (!debitWallet)
        debitWallet = await this.walletModel.create({ owner: debitAccount });

      if (!creditWallet)
        creditWallet = await this.walletModel.create(creditAccount);
      const adminCharge = +(amount * (charge / 100)).toFixed(2);
      if (debitWallet.currentBalance < amount) {
        return ApiResponse.fail(
          'Insufficient balance',
          HttpStatus.FORBIDDEN,
          null,
        );
      }
      const debitWalletHistory = await this.walletHistoryModel.create({
        wallet: debitWallet._id,
        amount: amount,
        previousBalance: debitWallet.currentBalance,
        description,
        type: 'debit',
        user: debitAccount,
      });
      await this.walletHistoryModel.create({
        wallet: adminWallet._id,
        amount: adminCharge,
        previousBalance: adminWallet.currentBalance,
        description,
        type: 'credit',
        user: settings.admin,
      });
      adminWallet.currentBalance += adminCharge;
      await adminWallet.save();
      creditWallet.pendingBalance += amount - adminCharge;
      await creditWallet.save();
      debitWallet.currentBalance -= amount;
      await debitWallet.save();
      return ApiResponse.success('Wallet debited', HttpStatus.OK, {
        debitWallet,
        debitWalletHistory,
        initialCharge: adminCharge,
      });
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
  async transferWithPenalty(
    debitAccount: Types.ObjectId,
    creditAccount: Types.ObjectId,
    amount: number,
    description: string,
    initialCharge: number,
  ) {
    try {
      const settings = await this.settingsModel.findOne();
      const charge = settings.commissionPercent || 0;
      let debitWallet = await this.walletModel.findOne({ owner: debitAccount });
      let creditWallet = await this.walletModel.findOne({
        owner: creditAccount,
      });
      let adminWallet = await this.walletModel.findOne({
        owner: settings.admin,
      });
      if (!adminWallet)
        adminWallet = await this.walletModel.create({ owner: settings.admin });
      if (!debitWallet)
        debitWallet = await this.walletModel.create({ owner: debitAccount });

      if (!creditWallet)
        creditWallet = await this.walletModel.create(creditAccount);
      const adminCharge = +(amount * (charge / 100)).toFixed(2);
      const debitAmount = adminCharge + initialCharge;
      if (debitWallet.currentBalance < debitAmount) {
        throw new Error(
          `Your balance of #${debitWallet.currentBalance} is less than #${debitAmount}. Please top up your wallet`,
        );
      }
      const debitWalletHistory = await this.walletHistoryModel.create({
        wallet: debitWallet._id,
        amount: debitAmount,
        previousBalance: debitWallet.currentBalance,
        description,
        type: 'debit',
        user: debitAccount,
      });
      await this.walletHistoryModel.create({
        wallet: adminWallet._id,
        amount: adminCharge,
        previousBalance: adminWallet.currentBalance,
        description,
        type: 'credit',
        user: settings.admin,
      });
      await this.walletHistoryModel.create({
        wallet: creditWallet._id,
        amount: amount,
        previousBalance: creditWallet.currentBalance,
        description,
        type: 'credit',
        user: settings.admin,
      });
      adminWallet.currentBalance += adminCharge;
      await adminWallet.save();
      creditWallet.currentBalance += amount;
      await creditWallet.save();
      debitWallet.pendingBalance -= amount - initialCharge;
      debitWallet.currentBalance -= debitAmount;
      await debitWallet.save();
      return ApiResponse.success('Wallet debited', HttpStatus.OK, {
        debitWallet,
        debitWalletHistory,
      });
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
  async transferToCurrentBalance(
    owner: Types.ObjectId,
    price: number,
    description: string,
    initialCharge: number,
  ) {
    try {
      let wallet = await this.walletModel.findOne({ owner });
      if (!wallet) wallet = await this.walletModel.create({ owner });
      await this.walletHistoryModel.create({
        wallet: wallet._id,
        amount: price - initialCharge,
        previousBalance: wallet.currentBalance,
        description,
        type: 'credit',
        user: owner,
      });
      wallet.pendingBalance -= price - initialCharge;
      wallet.currentBalance += price - initialCharge;
      await wallet.save();
      return ApiResponse.success('Wallet funded', HttpStatus.OK, wallet);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async initiateSetTransactionPin(user: UserDocument, pin: string) {
    try {
      if (pin.length !== 4 || typeof Number(pin) !== 'number')
        throw new Error('Your wallet pin must include 4 numbers');
      const hashedPin = hashSync(pin, 12);
      const token = await this.tokenService.createToken(
        user,
        'set-pin',
        hashedPin,
      );
      if (!token.status) return token;
      await mailService(
        user.email,
        'Set Transaction Pin',
        { user, token: token.data },
        'set-pin',
      );
      return ApiResponse.success(
        'Kindly check your mail to set your transaction pin',
      );
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
  async setTransactionPin(token: string) {
    try {
      const tokenData = await this.tokenService.verifyToken(token, 'set-pin');
      if (!tokenData.status) return tokenData;
      let wallet = await this.walletModel.findOne({
        owner: tokenData?.data?.user,
      });
      if (!wallet) {
        wallet = await this.walletModel.create({
          owner: tokenData?.data?.user,
        });
      }
      wallet.pin = tokenData?.data?.payload;
      await wallet.save();
      return ApiResponse.success(
        'Successfully set trasaction pin',
        HttpStatus.OK,
        null,
      );
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async createWalletHistory(
    wallet: Types.ObjectId,
    amount: number,
    previousBalance: number,
    description: string,
    type: string,
    user: Types.ObjectId,
  ) {
    try {
      const history = await this.walletHistoryModel.create({
        wallet,
        amount,
        previousBalance,
        description,
        type,
        user,
      });
      return ApiResponse.success(
        'Wallet history created',
        HttpStatus.OK,
        history,
      );
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async deleteWallet(walletId: Types.ObjectId) {
    await this.walletModel.deleteOne({ _id: walletId });
  }
}
