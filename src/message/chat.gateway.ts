import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';

import {
  Server,
  Socket,
} from 'socket.io';

import {
  JwtService,
} from '@nestjs/jwt';

import {
  ConfigService,
} from '@nestjs/config';

import {
  WsException,
} from '@nestjs/websockets';

import {
  RedisService,
} from '../redis/redis.service.js';

import {
  MessagesService,
} from './messages.service.js';

interface JwtPayload {
  sub: string;
  username: string;
  jti: string;
}

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      process.env.FRONTEND_URL ||
        'http://localhost:3000',
    ],

    credentials: true,
  },
})
export class ChatGateway
  implements OnGatewayConnection
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService:
      JwtService,

    private readonly configService:
      ConfigService,

    private readonly redisService:
      RedisService,

    private readonly messagesService:
      MessagesService,
  ) {}

  async handleConnection(
    client: Socket,
  ) {
    try {
      const token =
        client.handshake.auth
          ?.token;

      if (!token) {
        client.disconnect();
        return;
      }

      const payload =
        await this.jwtService.verifyAsync<JwtPayload>(
          token,
          {
            secret:
              this.configService.getOrThrow<string>(
                'JWT_SECRET',
              ),
          },
        );

      const validSession =
        await this.redisService.validateSession(
          payload.jti,
          token,
        );

      if (!validSession) {
        client.emit(
          'auth_error',
          {
            message:
              'Invalid session',
          },
        );

        client.disconnect();
        return;
      }

      // Never accept userId from frontend.
      // JWT-la irundhu mattum user identify pannuvom.
      client.data.userId =
        payload.sub;

      client.data.username =
        payload.username;

      await client.join(
        `user:${payload.sub}`,
      );

      console.log(
        `Socket connected: ${payload.username}`,
      );
    } catch {
      client.emit(
        'auth_error',
        {
          message:
            'Invalid token',
        },
      );

      client.disconnect();
    }
  }

  @SubscribeMessage(
    'send_message',
  )
  async sendMessage(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    body: {
      receiverId: string;
      content: string;
    },
  ) {
    try {
      if (!client.data.userId) {
        throw new WsException(
          'Unauthorized',
        );
      }

      const message =
        await this.messagesService.sendMessage(
          client.data.userId,
          body.receiverId,
          body.content,
        );

      // Sender oda all devices
      // + receiver oda all devices
      this.server
        .to(
          `user:${client.data.userId}`,
        )
        .to(
          `user:${body.receiverId}`,
        )
        .emit(
          'new_message',
          message,
        );

      return {
        success: true,
        message,
      };
    } catch (error) {
      throw new WsException(
        error instanceof Error
          ? error.message
          : 'Unable to send message',
      );
    }
  }

  @SubscribeMessage(
    'typing',
  )
  typing(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    body: {
      receiverId: string;
      isTyping: boolean;
    },
  ) {
    if (
      !client.data.userId ||
      !body.receiverId
    ) {
      return;
    }

    this.server
      .to(
        `user:${body.receiverId}`,
      )
      .emit(
        'typing',
        {
          userId:
            client.data.userId,

          isTyping:
            body.isTyping,
        },
      );
  }

  @SubscribeMessage(
    'mark_seen',
  )
  async markSeen(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    body: {
      userId: string;
    },
  ) {
    if (!client.data.userId) {
      throw new WsException(
        'Unauthorized',
      );
    }

    const result =
      await this.messagesService.markAsSeen(
        client.data.userId,
        body.userId,
      );

    // Other user-ku seen update
    this.server
      .to(
        `user:${body.userId}`,
      )
      .emit(
        'messages_seen',
        {
          seenBy:
            client.data.userId,

          seenAt:
            result.seenAt,
        },
      );

    return {
      success: true,
      ...result,
    };
  }
}