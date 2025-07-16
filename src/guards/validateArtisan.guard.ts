import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UserDocument } from '../user/user.schema';

@Injectable()
export class ValidateArtisan implements CanActivate {
  canActivate(context: ExecutionContext) {
    const user: UserDocument = context.switchToHttp().getRequest().user;
    if (user.type !== 'artisan') {
      throw new HttpException(
        'Action can only be carried out by artisans',
        HttpStatus.BAD_REQUEST,
      );
    } else if (user.status !== 'active') {
      throw new HttpException(
        'Kindly verify your account to continue with this action',
        HttpStatus.BAD_REQUEST,
      );
    } else {
      return true;
    }
  }
}
