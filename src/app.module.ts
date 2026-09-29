import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { RedisModule } from './redis/redis.module.js';
import { AuthModule } from './auth/auth.module.js';
import { MessagesModule } from './message/messages.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        type: 'postgres',

        url: configService.getOrThrow<string>('DATABASE_URL'),

        ssl:
          configService.get<string>('DB_SSL') === 'true'
            ? { rejectUnauthorized: false }
            : false,

        autoLoadEntities: true,
        synchronize: false,
      }),
    }),

    RedisModule,
    AuthModule,
    MessagesModule,
    UsersModule,
  ],

  controllers: [AppController],

  providers: [
    AppService,
  ],
})
export class AppModule {}