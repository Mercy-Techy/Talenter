import {
  Controller,
  Get,
  UseGuards,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  Post,
  Body,
  Query,
  Res,
  ValidationPipe,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { UserService } from './user.service';
import {
  ApiBearerAuth,
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthUser } from '../decorators/user.decorator';
import { UserDocument } from './user.schema';
import { JwtAuthGuard } from '../guards/auth.guard';
import { Express, Response } from 'express';
import { UpdateProfileDto, verifyAccountBody } from './user.dto';
import { Types } from 'mongoose';
import { response } from '../utility/ApiResponse';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiOkResponse()
@ApiBadRequestResponse()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @ApiNotFoundResponse()
  @Get()
  async getUser(@AuthUser() user: UserDocument, @Res() res: Response) {
    return response(res, await this.userService.getUser({ _id: user._id }));
  }

  @ApiQuery({ name: 'page', type: 'number', required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: 'number', required: false, example: 1 })
  @Get('/clients')
  async getClients(
    @Res() res: Response,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return response(
      res,
      await this.userService.getUsers({ type: 'client' }, true, page, limit),
    );
  }

  @ApiNotFoundResponse()
  @Post('profile-update')
  async updateAbout(
    @AuthUser('_id') userId: Types.ObjectId,
    @Body(new ValidationPipe({ whitelist: true }))
    updateProfile: UpdateProfileDto,
    @Res() res: Response,
  ) {
    return response(
      res,
      await this.userService.updateUser(userId, { ...updateProfile }),
    );
  }

  @ApiNotFoundResponse()
  @Post('upload-avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiBody({
    required: true,
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  async uploadAvatar(
    @UploadedFile() avatar: Express.Multer.File,
    @AuthUser() user: UserDocument,
    @Res() res: Response,
  ) {
    return response(res, await this.userService.uploadAvatar(avatar, user));
  }

  @Post('/verify-account')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'workPlacePhotos', maxCount: 5 },
      { name: 'utilityBills', maxCount: 5 },
      { name: 'officialDocuments', maxCount: 5 },
    ]),
  )
  @ApiBody(verifyAccountBody)
  @ApiConsumes('multipart/form-data')
  async verifyUser(
    @UploadedFiles()
    files: {
      workPlacePhotos?: Express.Multer.File[];
      utilityBills?: Express.Multer.File[];
      officialDocuments?: Express.Multer.File[];
    },
    @AuthUser() user: UserDocument,
    @Res() res: Response,
  ) {
    return response(res, await this.userService.verifyAccount(user, files));
  }
  @ApiQuery({ name: 'service', type: 'string', required: false })
  @ApiQuery({ name: 'page', type: 'number', required: false })
  @Get('artisans')
  async fetchArtisans(
    @Res() res: Response,
    @AuthUser() user: UserDocument,
    @Query('service') service: string,
    @Query('page') page: number,
  ) {
    return response(
      res,
      await this.userService.fetchArtisans(
        service,
        user?.about?.officeAddress?.placeId,
        true,
        page,
      ),
    );
  }

  @ApiQuery({ name: 'page', type: 'number', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @ApiQuery({ name: 'address', type: 'string', required: false })
  @ApiQuery({ name: 'service', type: 'string', required: false })
  @Get('client-search')
  async userSearch(
    @Res() res: Response,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('address') address: string,
    @Query('service') service: string,
  ) {
    return response(
      res,
      await this.userService.clientSearch(page, limit, address, service),
    );
  }
}
