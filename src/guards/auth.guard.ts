import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy, AuthGuard } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { config } from 'dotenv';
import mongoose from 'mongoose';
import { User, UserSchema } from '../user/user.schema';
import { HttpStatus, HttpException } from '@nestjs/common';

config();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_CONSTANT,
    });
  }

  async validate(payload: any) {
    try {
      const mongooseConn = await mongoose.connect(process.env.DATABASE_URI);
      const user = await mongooseConn
        .model(User.name, UserSchema)
        .findById(payload.sub);
      if (!user)
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      return user;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }
  }
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
