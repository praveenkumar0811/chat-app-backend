import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { createHash } from 'crypto';

@Injectable()
export class RedisService
  implements
    OnModuleInit,
    OnModuleDestroy
{
  private readonly redis: Redis;

  constructor(
    private readonly configService:
      ConfigService,
  ) {
    this.redis = new Redis(
      this.configService.getOrThrow<string>(
        'REDIS_URL',
      ),
      {
        maxRetriesPerRequest: 3,
      },
    );

    this.redis.on(
      'error',
      (error) => {
        console.error(
          'Redis Error:',
          error.message,
        );
      },
    );
  }

  async onModuleInit() {
    const result =
      await this.redis.ping();

    console.log(
      `Redis connection: ${result}`,
    );
  }

  private hashToken(
    token: string,
  ): string {
    return createHash('sha256')
      .update(token)
      .digest('hex');
  }

  async createSession(
    jti: string,
    token: string,
    user: {
      id: string;
      username: string;
    },
  ) {
    const tokenHash =
      this.hashToken(token);

    const ttl =
      60 * 60 * 24 * 7;

    await this.redis.set(
      `auth:session:${jti}`,

      JSON.stringify({
        userId: user.id,
        username:
          user.username,
        tokenHash,
      }),

      'EX',
      ttl,
    );
  }

  async validateSession(
    jti: string,
    token: string,
  ): Promise<boolean> {
    const data =
      await this.redis.get(
        `auth:session:${jti}`,
      );

    if (!data) {
      return false;
    }

    const session =
      JSON.parse(data);

    return (
      session.tokenHash ===
      this.hashToken(token)
    );
  }

  async deleteSession(
    jti: string,
  ) {
    await this.redis.del(
      `auth:session:${jti}`,
    );
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}