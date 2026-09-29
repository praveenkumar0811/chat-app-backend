import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

import { User } from '../users/user.entity.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RedisService } from '../redis/redis.service.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly jwtService: JwtService,

    private readonly redisService: RedisService,
  ) {}

  async register(dto: RegisterDto) {
    const username = dto.username.trim().toLowerCase();

    const existingUser = await this.userRepository.findOne({
      where: {
        username,
      },
    });

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({
      name: dto.name.trim(),
      username,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);

    const accessToken = await this.generateToken(savedUser);

    return {
      message: 'User registered successfully',
      user: {
        id: savedUser.id,
        name: savedUser.name,
        username: savedUser.username,
      },
      accessToken,
    };
  }

  async login(dto: LoginDto) {
    const username = dto.username.trim().toLowerCase();

    const user = await this.userRepository.findOne({
      where: {
        username,
      },
      select: {
        id: true,
        name: true,
        username: true,
        password: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Invalid username or password',
      );
    }

    const passwordMatched = await bcrypt.compare(
      dto.password,
      user.password,
    );

    if (!passwordMatched) {
      throw new UnauthorizedException(
        'Invalid username or password',
      );
    }

    const accessToken = await this.generateToken(user);

    return {
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
      },
      accessToken,
    };
  }

  private async generateToken(user: User) {
    const jti = randomUUID();

    const token = await this.jwtService.signAsync({
      sub: user.id,
      username: user.username,
      jti,
    });

    await this.redisService.createSession(jti, token, {
      id: user.id,
      username: user.username,
    });

    return token;
  }
}