import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { PaystackModule } from '../paystack/paystack.module';
import { WalletModule } from '../wallet/wallet.module';
import { BankModule } from '../bank/bank.module';
import { TokenModule } from '../auth/token/token.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from './transaction.schema';
import { Settings, SettingsSchema } from '../admin/settings.schema';

@Module({
  providers: [TransactionService],
  exports: [TransactionService],
  controllers: [TransactionController],
  imports: [
    PaystackModule,
    WalletModule,
    BankModule,
    TokenModule,
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: Settings.name, schema: SettingsSchema },
    ]),
  ],
})
export class TransactionModule {}
