import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1710000000000 implements MigrationInterface {
  name = 'InitSchema1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "email" character varying NOT NULL,
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "tasks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "description" text,
        "status" character varying NOT NULL DEFAULT 'todo',
        "dueDate" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tasks_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "task_assignees" (
        "task_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        CONSTRAINT "PK_task_assignees" PRIMARY KEY ("task_id", "user_id"),
        CONSTRAINT "FK_task_assignees_task" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_task_assignees_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_task_assignees_task_id" ON "task_assignees" ("task_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_task_assignees_user_id" ON "task_assignees" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_task_assignees_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_task_assignees_task_id"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "task_assignees"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tasks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
