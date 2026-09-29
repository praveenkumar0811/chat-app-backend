import {
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

import { MessagesService } from './messages.service.js';

interface AuthRequest extends Request {
  user: {
    userId: string;
    username: string;
    jti: string;
  };
}

@Controller('messages')
@UseGuards(AuthGuard('jwt'))
export class MessagesController {
  constructor(
    private readonly messagesService:
      MessagesService,
  ) {}

  @Get(':userId')
  getMessages(
    @Req() req: AuthRequest,
    @Param('userId') userId: string,
  ) {
    return this.messagesService.getMessages(
      req.user.userId,
      userId,
    );
  }
}