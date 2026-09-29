import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, ILike } from 'typeorm';
import { User } from './user.entity.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getAllUsers(currentUserId: string) {
    return this.userRepository.find({
      where: {
        id: Not(currentUserId),
      },
      select: {
        id: true,
        name: true,
        username: true,
        createdAt: true,
      },
      order: {
        name: 'ASC',
      },
    });
  }

  async searchUsers(currentUserId: string, query: string) {
    const trimmed = query.trim();
    if (!trimmed) {
      return this.getAllUsers(currentUserId);
    }

    return this.userRepository.find({
      where: [
        {
          id: Not(currentUserId),
          name: ILike(`%${trimmed}%`),
        },
        {
          id: Not(currentUserId),
          username: ILike(`%${trimmed}%`),
        },
      ],
      select: {
        id: true,
        name: true,
        username: true,
        createdAt: true,
      },
      order: {
        name: 'ASC',
      },
    });
  }
}
