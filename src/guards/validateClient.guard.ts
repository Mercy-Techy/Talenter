import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UserDocument } from '../user/user.schema';

@Injectable()
export class ValidateClient implements CanActivate {
  canActivate(context: ExecutionContext) {
    const user: UserDocument = context.switchToHttp().getRequest().user;
    if (user.type !== 'client') {
      throw new HttpException(
        'Action can only be carried out by clients',
        HttpStatus.BAD_REQUEST,
      );
    } else {
      return true;
    }
  }
}
