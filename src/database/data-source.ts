import 'dotenv/config';

import { DataSource } from 'typeorm';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { User } from '../users/user.entity.js';
import { Message } from '../message/message.entity.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sslEnabled = process.env.DB_SSL === 'true';

export default new DataSource({
  type: 'postgres',

  url: process.env.DATABASE_URL,

  ssl: sslEnabled
    ? {
        rejectUnauthorized: false,
      }
    : false,

  entities: [User, Message],

  migrations: [
    join(__dirname, 'migrations', '*.{ts,js}'),
  ],

  synchronize: false,
});