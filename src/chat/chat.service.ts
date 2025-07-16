import { HttpStatus, Injectable, Type } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Chat, ChatDocument } from './chat.schema';
import { Model, Types } from 'mongoose';
import { ApiResponse } from '../utility/ApiResponse';
import { Message } from './message.schema';
import { NotificationService } from '../notification/notification.service';
import { messageAdminDto, sendMessageDto } from './chat.dto';
import { UserDocument } from '../user/user.schema';
import { FileService } from '../File/file.service';
import { SocketGateway } from '../socket/socket.gateway';
import paginateFunction from '../utility/paginateFunction';
import { UserService } from '../user/user.service';
import { Settings } from '../admin/settings.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<Chat>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(Settings.name) private settingsModel: Model<Settings>,
    private notificationService: NotificationService,
    private fileService: FileService,
    private socketGateWay: SocketGateway,
    private userService: UserService,
  ) {}

  async initiateChat(
    users: Types.ObjectId[],
    chatId?: Types.ObjectId,
    type: string = 'user',
  ) {
    try {
      let chat: Chat;
      if (chatId) {
        chat = await this.chatModel.findById(chatId);
      }
      if (!chat) {
        chat = await this.chatModel.findOne({ users: { $all: users } });
      }
      if (!chat) {
        chat = await this.chatModel.create({ users, type });
      }
      //socketIo
      return ApiResponse.success('Chat created', HttpStatus.OK, chat);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.OK, error);
    }
  }
  async sendMsg(
    sender: Types.ObjectId,
    ids: Types.ObjectId[],
    content: any,
    type: string = 'text',
    configs: any = {},
    chatid: Types.ObjectId = null,
    fileIds?: Types.ObjectId[],
    chatType: string = 'user',
  ) {
    try {
      const senderDetails = await this.userService.getUser({ _id: sender });
      if (!senderDetails.status) throw new Error('Sender does not exist');
      const chatDetails = await this.initiateChat(
        [sender, ...ids],
        chatid,
        chatType,
      );
      if (!chatDetails.status) return chatDetails;
      const chat = chatDetails.data;
      const chatId = chat._id;
      const { users } = chat;
      const receivers = users.filter(
        (user: Types.ObjectId) => user?.toString() !== sender?.toString(),
      );
      if (!receivers.length) {
        throw new Error('Receipient not found');
      }
      if (type !== 'file') {
        content = [content];
      }
      const messageDetails = await this.messageCreator(
        sender,
        receivers,
        chatId,
        type,
        content,
        configs,
        fileIds,
      );
      if (!messageDetails.status) return messageDetails;
      const message = messageDetails.data;
      chat.lastMessage = message._id;
      chat.lastMessageDate = message.createdAt;
      chat.newMessageCount += 1;
      chat.lastMessageBy = senderDetails.data._id;
      await chat.save();
      for (let receiver of receivers) {
        this.socketGateWay.emitMessageToUser(receiver?.toString(), message);
      }
      return ApiResponse.success('Message sent', HttpStatus.OK, message);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.OK, error);
    }
  }

  async messageCreator(
    sender: Types.ObjectId,
    receivers: Types.ObjectId[],
    chat: Types.ObjectId,
    type: string,
    content: any,
    configs: any = {
      socket: true,
    },
    fileIds: Types.ObjectId[] = [],
  ) {
    try {
      const message = await this.messageModel.create({
        chat,
        type,
        content,
        sender,
        receivers,
        fileIds,
      });
      const newMessage = message.toObject();
      const files = await this.fileService.fetchFiles(fileIds);
      if (files.status) {
        newMessage.fileIds = files.data;
      }
      await this.notificationService.createNotification(
        {
          message: 'You have a new chat',
          type: 'Chat',
          title: 'You have a new message',
          payload: sender,
        },
        receivers,
        null,
        true,
      );
      return ApiResponse.success('Message created', HttpStatus.OK, newMessage);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.OK, error);
    }
  }

  async sendMessageByChatId(
    chatDetails: sendMessageDto,
    user: UserDocument,
    files?: Express.Multer.File[],
  ) {
    try {
      let { chatId, type, content } = chatDetails;
      const chat = await this.chatModel.findById(chatId);
      if (!chat)
        return ApiResponse.fail(
          'Chat does not exist',
          HttpStatus.NOT_FOUND,
          null,
        );
      const receivers = chat.users.filter(
        (us) => us.toString() !== user._id.toString(),
      );
      if (receivers.length < 1) throw new Error('Receipient not found');
      let fileDetails: any = null;
      if (type === 'file') {
        if (!files?.length) throw new Error('No file uploaded');
        fileDetails = await this.fileService.createFiles(
          files,
          user._id,
          'any',
        );
        if (!fileDetails.status) return fileDetails;
        const filesDetails = await this.fileService.fetchFiles(
          fileDetails.data,
        );
        if (!filesDetails.status) return filesDetails;
        content = filesDetails.data.map((file) => {
          return file.url;
        });
      }

      return await this.sendMsg(
        user._id,
        receivers,
        content,
        type,
        {},
        chatId,
        fileDetails?.data,
      );
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async fetchChats(userId: Types.ObjectId, page: number, limit: number) {
    try {
      return await paginateFunction(
        this.chatModel,
        page,
        limit,
        [
          {
            path: 'users',
            select: 'firstName avatar lastName',
            populate: {
              path: 'avatar',
              model: 'File',
              select: 'url',
            },
          },
          {
            path: 'lastMessage',
            select: 'type content sender createdAt updatedAt',
          },
          { path: 'lastMessageBy', select: 'firstName lastName ' },
        ],
        {
          users: { $in: [userId] },
        },
        'updatedAt',
        -1,
      );
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async searchChats(searchString: string = '') {
    try {
      const chats = await this.chatModel
        .find()
        .populate({
          path: 'users',
          select: 'firstName avatar lastName',
          match: {
            $or: [
              { firstName: { $regex: searchString, $options: 'i' } },
              { lastName: { $regex: searchString, $options: 'i' } },
            ],
          },
          populate: {
            path: 'avatar',
            model: 'File',
            select: 'url',
          },
        })
        .populate({
          path: 'lastMessage',
          select: 'type content sender createdAt updatedAt',
        })
        .populate({
          path: 'lastMessageBy',
          select: 'firstName lastName',
        });
      const filteredChats = chats.filter((chat) => chat?.users?.length > 0);
      return ApiResponse.success('chats', HttpStatus.OK, filteredChats);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async fetchChatMessages(
    userId: Types.ObjectId,
    chatId?: Types.ObjectId,
    receiverId?: Types.ObjectId,
    page?: number,
  ) {
    try {
      let chat: ChatDocument;
      if (chatId) {
        chat = await this.chatModel.findById(chatId);
      } else if (!chatId && receiverId) {
        chat = await this.chatModel.findOne({
          users: { $all: [userId, new Types.ObjectId(receiverId)] },
        });
      }
      if (!chat) throw new Error('Chat does not exist');
      if (chat.lastMessageBy?.toString() !== userId.toString()) {
        chat.newMessageCount = 0;
        await chat.save();
      }
      const messagesDetails = await paginateFunction(
        this.messageModel,
        page,
        50,
        [{ path: 'fileIds', select: ' originalname' }],
        { chat: chat._id },
      );
      if (!messagesDetails.status) return messagesDetails;
      const updatedMessages = messagesDetails.data.data;
      for (let message of updatedMessages) {
        const existing = message.receivers.find(
          (user) => user.toString() === userId.toString(),
        );
        const read = message.read.find(
          (user) => user.toString() === userId.toString(),
        );
        if (existing && !read) {
          message.read.push(userId);
          chat.newMessageCount -= 1;
          await chat.save();
          await message.save();
        }
        messagesDetails.data.data = updatedMessages;
      }
      return ApiResponse.success('Chat', HttpStatus.OK, messagesDetails);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
  async deleteSenderMessage(userId: Types.ObjectId, messageId: Types.ObjectId) {
    try {
      const message = await this.messageModel.findOneAndDelete({
        _id: messageId,
        sender: userId,
      });
      if (!message)
        return ApiResponse.fail(
          'Message does not exist',
          HttpStatus.NOT_FOUND,
          null,
        );
      return ApiResponse.success('Message Deleted', HttpStatus.OK, null);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
  async deleteChat(chatId: Types.ObjectId) {
    try {
      const chat = await this.chatModel.findOneAndDelete({ _id: chatId });
      if (!chat)
        return ApiResponse.fail(
          'Chat does not exist',
          HttpStatus.NOT_FOUND,
          null,
        );
      const messages = await this.messageModel.find({ chat: chat._id });
      let fileIdsArray = [];
      for (let message of messages) {
        if (message?.fileIds?.length) {
          fileIdsArray = [...fileIdsArray, ...message.fileIds];
        }
      }
      await this.fileService.deleteFiles(fileIdsArray);
      await this.messageModel.deleteMany({ chat: chat._id });
      return ApiResponse.success('Chat Deleted', HttpStatus.OK, null);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async sendMessageToAdmin(
    chatDetails: messageAdminDto,
    user: UserDocument,
    files?: Express.Multer.File[],
  ) {
    try {
      let { type, content } = chatDetails;
      let receiver: Types.ObjectId;
      const settings = await this.settingsModel.findOne();
      if (!settings?.admin)
        throw new Error('Action interrupted, try again later');
      receiver = settings.admin;
      if (settings.admin?.toString() === user._id?.toString())
        receiver = chatDetails.receiverId;
      let fileDetails: any = null;
      if (type === 'file') {
        if (!files?.length) throw new Error('No file uploaded');
        fileDetails = await this.fileService.createFiles(
          files,
          user._id,
          'any',
        );
        if (!fileDetails.status) return fileDetails;
        const filesDetails = await this.fileService.fetchFiles(
          fileDetails.data,
        );
        if (!filesDetails.status) return filesDetails;
        content = filesDetails.data.map((file) => {
          return file.url;
        });
      }

      return await this.sendMsg(
        user._id,
        [new Types.ObjectId(receiver)],
        content,
        type,
        {},
        null,
        fileDetails?.data,
        'admin',
      );
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
}
