import {
  MigrationInterface,
  QueryRunner,
} from 'typeorm';

export class CreateUsersTable1790677800000
  implements MigrationInterface
{
  name = 'CreateUsersTable1790677800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
    );

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(100) NOT NULL,
        "username" varchar(50) NOT NULL,
        "password" varchar NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_username" UNIQUE ("username"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "users"
    `);
  }
}