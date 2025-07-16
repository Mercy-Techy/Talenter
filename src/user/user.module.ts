import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema';
import * as bcrypt from 'bcryptjs';
import { FileModule } from '../File/file.module';
import { WalletModule } from '../wallet/wallet.module';
import { AddressModule } from '../address/address.module';

const options: any = {
  deletedAt: true,
  deletedBy: true,
  overrideMethods: 'all',
};

@Module({
  providers: [UserService],
  controllers: [UserController],
  imports: [
    AddressModule,
    MongooseModule.forFeatureAsync([
      {
        name: User.name,
        useFactory: () => {
          const schema = UserSchema;
          schema.pre('save', async function (next) {
            if (this.isModified('password')) {
              this.password = await bcrypt.hash(this.password, 12);
            }
            next();
          });
          schema.plugin(require('mongoose-delete'), options);
          return schema;
        },
      },
    ]),
    FileModule,
    WalletModule,
  ],
  exports: [MongooseModule, UserService],
})
export class UserModule {}
