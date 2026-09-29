import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'crypto';

@Injectable()
export class MessageEncryptionService {
  private readonly key: Buffer;

  constructor(
    private readonly configService: ConfigService,
  ) {
    const key =
      this.configService.getOrThrow<string>(
        'MESSAGE_ENCRYPTION_KEY',
      );

    this.key = Buffer.from(key, 'hex');

    if (this.key.length !== 32) {
      throw new Error(
        'MESSAGE_ENCRYPTION_KEY must be exactly 32 bytes',
      );
    }
  }

  encrypt(content: string): string {
    const iv = randomBytes(12);

    const cipher = createCipheriv(
      'aes-256-gcm',
      this.key,
      iv,
    );

    const encrypted = Buffer.concat([
      cipher.update(content, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return [
      iv.toString('hex'),
      authTag.toString('hex'),
      encrypted.toString('hex'),
    ].join(':');
  }

  decrypt(value: string): string {
    const [
      ivHex,
      authTagHex,
      encryptedHex,
    ] = value.split(':');

    if (!ivHex || !authTagHex || !encryptedHex) {
      throw new Error('Invalid encrypted message');
    }

    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.key,
      Buffer.from(ivHex, 'hex'),
    );

    decipher.setAuthTag(
      Buffer.from(authTagHex, 'hex'),
    );

    const decrypted = Buffer.concat([
      decipher.update(
        Buffer.from(encryptedHex, 'hex'),
      ),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }
}