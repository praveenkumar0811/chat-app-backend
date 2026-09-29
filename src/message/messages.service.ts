import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Message } from './message.entity.js';
import { User } from '../users/user.entity.js';

import { MessageEncryptionService } from '../common/message-encryption.service.js';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository:
      Repository<Message>,

    @InjectRepository(User)
    private readonly userRepository:
      Repository<User>,

    private readonly encryptionService:
      MessageEncryptionService,
  ) {}

  async sendMessage(
    senderId: string,
    receiverId: string,
    content: string,
  ) {
    const cleanContent = content.trim();

    if (!cleanContent) {
      throw new BadRequestException(
        'Message cannot be empty',
      );
    }

    if (cleanContent.length > 4000) {
      throw new BadRequestException(
        'Message is too long',
      );
    }

    if (senderId === receiverId) {
      throw new BadRequestException(
        'You cannot send message to yourself',
      );
    }

    const [sender, receiver] = await Promise.all([
      this.userRepository.findOne({
        where: {
          id: senderId,
        },
        select: {
          id: true,
          name: true,
          username: true,
        },
      }),
      this.userRepository.findOne({
        where: {
          id: receiverId,
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (!receiver) {
      throw new NotFoundException(
        'Receiver not found',
      );
    }

    const encryptedContent =
      this.encryptionService.encrypt(
        cleanContent,
      );

    const message =
      this.messageRepository.create({
        senderId,
        receiverId,
        encryptedContent,
        seenAt: null,
      });

    const savedMessage =
      await this.messageRepository.save(
        message,
      );

    // Frontend-ku readable content return pannrom.
    // DB-la encryptedContent mattum save aagum.
    return {
      id: savedMessage.id,
      senderId: savedMessage.senderId,
      senderName: sender?.name || 'New Message',
      senderUsername: sender?.username || '',
      receiverId: savedMessage.receiverId,
      content: cleanContent,
      seenAt: savedMessage.seenAt,
      createdAt: savedMessage.createdAt,
    };
  }

  async getMessages(
    currentUserId: string,
    otherUserId: string,
  ) {
    const otherUser =
      await this.userRepository.findOne({
        where: {
          id: otherUserId,
        },

        select: {
          id: true,
        },
      });

    if (!otherUser) {
      throw new NotFoundException(
        'User not found',
      );
    }

    const messages =
      await this.messageRepository
        .createQueryBuilder('message')
        .where(
          `
          (
            message.senderId = :currentUserId
            AND
            message.receiverId = :otherUserId
          )
          OR
          (
            message.senderId = :otherUserId
            AND
            message.receiverId = :currentUserId
          )
          `,
          {
            currentUserId,
            otherUserId,
          },
        )
        .orderBy(
          'message.createdAt',
          'DESC',
        )
        .take(100)
        .getMany();

    return messages
      .reverse()
      .map((message) => ({
        id: message.id,

        senderId:
          message.senderId,

        receiverId:
          message.receiverId,

        content:
          this.encryptionService.decrypt(
            message.encryptedContent,
          ),

        seenAt:
          message.seenAt,

        createdAt:
          message.createdAt,
      }));
  }

  async markAsSeen(
    currentUserId: string,
    otherUserId: string,
  ) {
    const seenAt = new Date();

    const result =
      await this.messageRepository
        .createQueryBuilder()
        .update(Message)
        .set({
          seenAt,
        })
        .where(
          `"senderId" = :otherUserId`,
          {
            otherUserId,
          },
        )
        .andWhere(
          `"receiverId" = :currentUserId`,
          {
            currentUserId,
          },
        )
        .andWhere(
          `"seenAt" IS NULL`,
        )
        .execute();

    return {
      count: result.affected ?? 0,
      seenAt,
    };
  }
}