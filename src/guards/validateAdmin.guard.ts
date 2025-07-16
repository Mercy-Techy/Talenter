import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UserDocument } from '../user/user.schema';

@Injectable()
export class ValidateAdmin implements CanActivate {
  canActivate(context: ExecutionContext) {
    const user: UserDocument = context.switchToHttp().getRequest().user;
    if (user.type !== 'admin') {
      throw new HttpException(
        'Action can only be carried by admin',
        HttpStatus.BAD_REQUEST,
      );
    } else {
      return true;
    }
  }
}
