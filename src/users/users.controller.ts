import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { UsersService } from './users.service.js';

interface AuthRequest extends Request {
  user: {
    userId: string;
    username: string;
    jti: string;
  };
}

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getUsers(
    @Req() req: AuthRequest,
    @Query('search') search?: string,
  ) {
    if (search) {
      return this.usersService.searchUsers(req.user.userId, search);
    }
    return this.usersService.getAllUsers(req.user.userId);
  }
}
