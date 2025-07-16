import { Module } from '@nestjs/common';
import { NotificationModule } from '../notification/notification.module';
import { ChatService } from './chat.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Chat, ChatSchema } from './chat.schema';
import { Message, MessageSchema } from './message.schema';
import { FileModule } from '../File/file.module';
import { SocketModule } from '../socket/socket.module';
import { ChatController } from './chat.controller';
import { UserModule } from '../user/user.module';
import { Settings, SettingsSchema } from '../admin/settings.schema';

@Module({
  imports: [
    NotificationModule,
    FileModule,
    SocketModule,
    MongooseModule.forFeatureAsync([
      {
        name: Chat.name,
        useFactory: () => {
          const schema = ChatSchema;
          schema.pre('save', async function (next) {
            if (this.users.length < 2 && this.type !== 'admin') {
              next(new Error('Chat must have 2 users and above'));
            }
            next();
          });
          return schema;
        },
      },
    ]),
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Settings.name, schema: SettingsSchema },
    ]),
    UserModule,
  ],
  providers: [ChatService],
  controllers: [ChatController],
  exports: [ChatService, MongooseModule],
})
export class ChatModule {}
