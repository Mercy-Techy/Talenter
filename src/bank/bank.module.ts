import { Module } from '@nestjs/common';
import { BankService } from './bank.service';
import { BankController } from './bank.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Bank, BankSchema } from './bank.schema';
import { PaystackModule } from '../paystack/paystack.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Bank.name, schema: BankSchema }]),
    PaystackModule,
  ],
  providers: [BankService],
  exports: [BankService, MongooseModule],
  controllers: [BankController],
})
export class BankModule {}
