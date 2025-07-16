import { Module } from '@nestjs/common';
import { DatabaseRootModule } from './database/databaseRoot.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { WalletModule } from './wallet/wallet.module';
import { JobModule } from './Job/job.module';
import { AppController } from './app.controller';
import { NotificationModule } from './notification/notification.module';
import { ServicesModule } from './services/services.module';
import { AddressModule } from './address/address.module';
import { ChatModule } from './chat/chat.module';
import { ReviewModule } from './review/review.module';
import { BankModule } from './bank/bank.module';
import { PaystackModule } from './paystack/paystack.module';
import { TransactionModule } from './transaction/transaction.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseRootModule,
    AuthModule,
    UserModule,
    WalletModule,
    JobModule,
    NotificationModule,
    ServicesModule,
    AddressModule,
    ChatModule,
    ReviewModule,
    BankModule,
    PaystackModule,
    TransactionModule,
    AdminModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
