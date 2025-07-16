import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
  ValidationPipe,
  UseInterceptors,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiConsumes,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../guards/auth.guard';
import { response } from '../utility/ApiResponse';
import { ChatService } from './chat.service';
import { AuthUser } from '../decorators/user.decorator';
import { Types } from 'mongoose';
import { UserDocument } from '../user/user.schema';
import {
  messageAdminBody,
  messageAdminDto,
  sendMessageBody,
  sendMessageDto,
} from './chat.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@ApiTags('Chats')
@ApiBearerAuth()
@ApiBadRequestResponse()
@ApiOkResponse()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}
  @ApiQuery({ name: 'page', type: 'number', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @Get('fetch-chats')
  async fetchChats(
    @Res() res: Response,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @AuthUser('_id') userId: Types.ObjectId,
  ) {
    return response(
      res,
      await this.chatService.fetchChats(userId, page, limit),
    );
  }

  @ApiQuery({ name: 'page', type: 'number', required: false })
  @ApiQuery({ name: 'chatId', type: 'string', required: true })
  @ApiQuery({ name: 'receiverId', type: 'string', required: false })
  @Get('fetch-chat-messages')
  async fetchChatsMessage(
    @Res() res: Response,
    @AuthUser('_id') userId: Types.ObjectId,
    @Query('chatId') chatId: Types.ObjectId,
    @Query('receiverId') receiverId: Types.ObjectId,
    @Query('page') page: number,
  ) {
    return response(
      res,
      await this.chatService.fetchChatMessages(
        userId,
        chatId,
        receiverId,
        page,
      ),
    );
  }

  @ApiQuery({ name: 'searchString', type: 'string', required: false })
  @Get('search-chats')
  async searchChats(
    @Res() res: Response,
    @Query('searchString') searchString: string,
  ) {
    return response(res, await this.chatService.searchChats(searchString));
  }

  @UseInterceptors(FileFieldsInterceptor([{ name: 'chatImages', maxCount: 5 }]))
  @ApiBody(sendMessageBody)
  @ApiConsumes('multipart/form-data')
  @ApiNotFoundResponse()
  @Post('send-message')
  async sendMessage(
    @UploadedFiles()
    chatImages: {
      chatImages: Express.Multer.File[];
    },
    @Res() res: Response,
    @AuthUser() user: UserDocument,
    @Body(new ValidationPipe()) chatDetails: sendMessageDto,
  ) {
    return response(
      res,
      await this.chatService.sendMessageByChatId(
        chatDetails,
        user,
        chatImages.chatImages,
      ),
    );
  }

  @UseInterceptors(FileFieldsInterceptor([{ name: 'chatImages', maxCount: 5 }]))
  @ApiBody(messageAdminBody)
  @ApiConsumes('multipart/form-data')
  @ApiNotFoundResponse()
  @Post('message-admin')
  async messageAdmin(
    @UploadedFiles()
    chatImages: {
      chatImages: Express.Multer.File[];
    },
    @Res() res: Response,
    @AuthUser() user: UserDocument,
    @Body(new ValidationPipe()) chatDetails: messageAdminDto,
  ) {
    return response(
      res,
      await this.chatService.sendMessageToAdmin(
        chatDetails,
        user,
        chatImages.chatImages,
      ),
    );
  }

  @ApiNotFoundResponse()
  @ApiParam({ name: 'messageId', type: 'string', required: true })
  @Delete('message/:messageId')
  async deleteMessage(
    @Param('messageId') messageId: Types.ObjectId,
    @Res() res: Response,
    @AuthUser('_id') userId: Types.ObjectId,
  ) {
    return response(
      res,
      await this.chatService.deleteSenderMessage(userId, messageId),
    );
  }

  @ApiNotFoundResponse()
  @ApiParam({ name: 'chatId', type: 'string', required: true })
  @Delete(':chatId')
  async deleteChat(
    @Param('chatId') chatId: Types.ObjectId,
    @Res() res: Response,
  ) {
    return response(res, await this.chatService.deleteChat(chatId));
  }
}
