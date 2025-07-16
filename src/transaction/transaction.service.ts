import { HttpStatus, Injectable } from '@nestjs/common';
import { PaystackService } from '../paystack/paystack.service';
import { UserDocument } from '../user/user.schema';
import { ApiResponse } from '../utility/ApiResponse';
import { BankService } from '../bank/bank.service';
import { Settings } from '../admin/settings.schema';
import { WalletService } from '../wallet/wallet.service';
import { Model, Types } from 'mongoose';
import { TokenService } from '../auth/token/token.service';
import { initiateTransferType } from '../paystack/paystack.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Transaction } from './transaction.schema';
import paginateFunction from '../utility/paginateFunction';
import { compareSync } from 'bcryptjs';

@Injectable()
export class TransactionService {
  constructor(
    private paystackService: PaystackService,
    private bankService: BankService,
    private walletService: WalletService,
    private tokenService: TokenService,
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
    @InjectModel(Settings.name) private settingsModel: Model<Settings>,
  ) {}

  async generateReference() {
    let availableReference: any = false;
    do {
      const reference = this.tokenService.tokenGenerator(30);
      const code = await this.transactionModel.findOne({ reference });
      if (!code) availableReference = reference;
    } while (!availableReference);
    return availableReference;
  }

  async fetchReference() {
    try {
      const reference = await this.generateReference();
      return ApiResponse.success('Reference', HttpStatus.OK, reference);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.OK, null);
    }
  }

  async withdraw(
    user: UserDocument,
    bankId: Types.ObjectId,
    amount: number,
    reason: string,
    pin: string,
  ) {
    try {
      if (amount < 100) throw new Error('Amount should not be less than 100');
      const settings = await this.settingsModel.findOne();
      const totalAmount = amount + (settings.chargePercent / 100) * amount;
      const bankDetails = await this.bankService.fetchConnectedBank(
        user._id,
        bankId,
      );
      if (!bankDetails.status) return bankDetails;
      const bank = bankDetails.data;
      const wallet = (await this.walletService.getWallet(user._id)).data.wallet;
      const isPin = compareSync(pin, wallet.pin);
      if (!isPin) throw new Error('Invalid pin');
      if (wallet.currentBalance < totalAmount)
        throw new Error(
          `Your balance of #${wallet.currentBalance} is less than #${totalAmount}. Please top up your wallet`,
        );
      const balance = await this.paystackService.checkAccountBalance();
      if (balance <= totalAmount)
        throw new Error(
          'Your withdrawal could not be processed at this moment, please contact admin or try again later',
        );
      const recipientCode =
        await this.paystackService.createTransferRecipient(bank);
      const reference = await this.generateReference();
      const transferDetails: initiateTransferType = {
        source: 'balance',
        amount: amount * 100,
        recipient: recipientCode,
        reason,
        reference,
      };
      const response =
        await this.paystackService.initiateTransfer(transferDetails);
      await this.transactionModel.create({
        user,
        amount,
        wallet,
        status: response.status,
        reference: response.reference,
        reason,
        transactionType: 'debit',
      });
      const history = await this.walletService.createWalletHistory(
        wallet._id,
        totalAmount,
        wallet.currentBalance,
        reason,
        'debit',
        user._id,
      );
      wallet.currentBalance -= totalAmount;
      await wallet.save();
      return ApiResponse.success(
        'Transaction successful',
        HttpStatus.OK,
        history,
      );
    } catch (error) {
      return ApiResponse.fail(
        error?.response?.data?.message || error.message,
        HttpStatus.BAD_REQUEST,
        null,
      );
    }
  }
  async fundWallet(user: UserDocument, reference: string) {
    try {
      const existingTransaction = await this.transactionModel.findOne({
        reference,
      });
      if (existingTransaction) throw new Error('Reference exist already');
      let history = null;
      const settings = await this.settingsModel.findOne();
      const {
        domain,
        status,
        amount: paystackAmount,
      } = await this.paystackService.verifyPayment(reference);
      // if (domain !== 'test') {
      if (status !== 'success') {
        return ApiResponse.fail('Transaction failed', HttpStatus.OK, null);
      }
      const wallet = (await this.walletService.getWallet(user._id)).data.wallet;
      const amount =
        paystackAmount / 100 -
        (settings.chargePercent / 100) * (paystackAmount / 100) -
        100;
      history = await this.walletService.createWalletHistory(
        wallet._id,
        amount,
        wallet.currentBalance,
        'Wallet Fund',
        'credit',
        user._id,
      );
      wallet.currentBalance += amount;
      await wallet.save();
      await this.transactionModel.create({
        user,
        amount,
        wallet,
        status,
        reference,
        reason: 'Wallet Fund',
        transactionType: 'credit',
      });
      // }
      return ApiResponse.success(
        'Transaction successful',
        HttpStatus.OK,
        history,
      );
    } catch (error) {
      return ApiResponse.fail(
        error?.response?.data?.message || error.message,
        HttpStatus.OK,
        null,
      );
    }
  }

  async fetchTransaction(page: number, limit: number, filter: any = {}) {
    return await paginateFunction(
      this.transactionModel,
      page,
      limit,
      { path: 'user', select: 'firstName lastName' },
      filter,
      'createdAt',
      -1,
    );
  }

  async searchTransactions(searchString: string = '') {
    try {
      const transactions = await this.transactionModel.find().populate({
        path: 'user',
        select: 'firstName lastName',
        match: {
          $or: [
            { firstName: { $regex: searchString, $options: 'i' } },
            { lastName: { $regex: searchString, $options: 'i' } },
          ],
        },
      });
      const filteredTransactions = transactions.filter(
        (transaction) => transaction?.user !== null,
      );
      return ApiResponse.success(
        'Transactions',
        HttpStatus.OK,
        filteredTransactions,
      );
    } catch (error: any) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
}
