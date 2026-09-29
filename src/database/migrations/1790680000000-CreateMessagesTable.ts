import {
  MigrationInterface,
  QueryRunner,
} from 'typeorm';

export class CreateMessagesTable1790680000000
  implements MigrationInterface
{
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "senderId" uuid NOT NULL,
        "receiverId" uuid NOT NULL,
        "encryptedContent" text NOT NULL,
        "seenAt" TIMESTAMP NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),

        CONSTRAINT "PK_messages_id"
        PRIMARY KEY ("id"),

        CONSTRAINT "FK_messages_sender"
        FOREIGN KEY ("senderId")
        REFERENCES "users"("id")
        ON DELETE CASCADE,

        CONSTRAINT "FK_messages_receiver"
        FOREIGN KEY ("receiverId")
        REFERENCES "users"("id")
        ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_messages_sender_receiver"
      ON "messages" ("senderId", "receiverId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_messages_receiver_seen"
      ON "messages" ("receiverId", "seenAt")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_messages_created_at"
      ON "messages" ("createdAt")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "messages"
    `);
  }
}