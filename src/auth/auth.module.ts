import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenModule } from './token/token.module';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { config } from 'dotenv';
import { JwtStrategy } from '../guards/auth.guard';
import { PassportModule } from '@nestjs/passport';
import { NotificationModule } from '../notification/notification.module';

config();

@Module({
  imports: [
    TokenModule,
    UserModule,
    PassportModule,
    NotificationModule,
    JwtModule.register({
      secret: process.env.JWT_CONSTANT,
      signOptions: { expiresIn: process.env.JWT_EXPIRY },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
