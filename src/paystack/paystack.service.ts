import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { BankDocument } from '../bank/bank.schema';
import { initiateTransferType } from './paystack.dto';

@Injectable()
export class PaystackService {
  private paystack: string;
  constructor(private configService: ConfigService) {
    this.paystack = this.configService.get<string>('PAYSTACK_KEY');
  }

  async fetchBanks(text: string = null) {
    const response = await axios('https://api.paystack.co/bank?currency=NGN', {
      headers: {
        Authorization: `Bearer ${this.paystack}`,
      },
    });
    let banks: any;
    if (text) {
      banks = response?.data?.data?.reduce(
        (acc: any, { id, code, name, country, type }) => {
          if (name.toLowerCase().includes(text.toLowerCase())) {
            acc.push({ id, code, name, country, type });
          }
          return acc;
        },
        [],
      );
    } else {
      banks = response?.data?.data?.map(
        ({ id, code, name, country, type }) => ({
          id,
          code,
          name,
          country,
          type,
        }),
      );
    }
    return banks;
  }

  async getAccountName(accountNumber: string, bankCode: string) {
    const response = await axios(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: {
          Authorization: `Bearer ${this.configService.get<string>('PAYSTACK_KEY')}`,
        },
      },
    );
    return response.data?.data?.account_name;
  }

  async createTransferRecipient(bank: BankDocument) {
    const data = {
      type: bank.type,
      name: bank.accountName,
      account_number: bank.accountNumber,
      bank_code: bank.bankCode,
      currency: 'NGN',
    };

    const response = await axios.post(
      'https://api.paystack.co/transferrecipient',
      data,
      {
        headers: {
          Authorization: `Bearer ${this.paystack}`,
        },
      },
    );
    return response?.data?.data?.recipient_code;
  }

  async checkAccountBalance() {
    const response = await axios('https://api.paystack.co/balance', {
      headers: { Authorization: `Bearer ${this.paystack}` },
    });
    return response?.data?.data?.balance;
  }

  async initiateTransfer(transferDetails: initiateTransferType) {
    const response = await axios.post(
      'https://api.paystack.co/transfer	',
      transferDetails,
      {
        headers: { Authorization: `Bearer ${this.paystack}` },
      },
    );
    return response?.data?.data;
  }

  async verifyPayment(reference: string) {
    const response = await axios(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${this.paystack}` },
      },
    );
    return response?.data?.data;
  }
}
