import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Message } from './message.entity.js';
import { User } from '../users/user.entity.js';

import { MessagesService } from './messages.service.js';

import { MessagesController } from './messages.controller.js';

import { ChatGateway } from './chat.gateway.js';

import { MessageEncryptionService } from '../common/message-encryption.service.js';

import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Message,
      User,
    ]),

    AuthModule,
  ],

  controllers: [
    MessagesController,
  ],

  providers: [
    MessagesService,
    ChatGateway,
    MessageEncryptionService,
  ],

  exports: [
    MessagesService,
  ],
})
export class MessagesModule {}