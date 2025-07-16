import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallet, WalletSchema } from './wallet.schema';
import { WalletController } from './wallet.controller';
import { WalletHistory, WalletHistorySchema } from './walletHistory.schema';
import { TokenModule } from '../auth/token/token.module';
import { Settings, SettingsSchema } from '../admin/settings.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wallet.name, schema: WalletSchema },
      { name: WalletHistory.name, schema: WalletHistorySchema },
      { name: Settings.name, schema: SettingsSchema },
    ]),
    TokenModule,
  ],
  providers: [WalletService],
  controllers: [WalletController],
  exports: [WalletService, MongooseModule],
})
export class WalletModule {}
