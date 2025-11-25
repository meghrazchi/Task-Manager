import { MigrationInterface, QueryRunner } from 'typeorm';
import { TaskStatus } from '../modules/tasks/domain/task-status.enum';

export class SeedUsersAndTasks1710000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const users = [
      { name: 'Ava Carter', email: 'ava.carter@example.com' },
      { name: 'Liam Patel', email: 'liam.patel@example.com' },
      { name: 'Sofia Nguyen', email: 'sofia.nguyen@example.com' },
      { name: 'Noah Kim', email: 'noah.kim@example.com' }
    ];

    const insertedUsers = await Promise.all(
      users.map((user) =>
        queryRunner.query(
          `INSERT INTO "users" ("name", "email") VALUES ($1, $2) RETURNING id, email`,
          [user.name, user.email]
        )
      )
    );

    const userIdByEmail: Record<string, string> = insertedUsers.reduce((acc, [row]) => {
      acc[row.email] = row.id;
      return acc;
    }, {} as Record<string, string>);

    const tasks = [
      {
        title: 'Outline product requirements for sprint kickoff',
        description: 'Draft and circulate the PRD sections for authentication and notifications.',
        status: TaskStatus.TODO,
        assignees: ['ava.carter@example.com']
      },
      {
        title: 'Create onboarding email templates',
        description: 'Write welcome and password-reset email copy with brand voice guidelines.',
        status: TaskStatus.TODO,
        assignees: ['liam.patel@example.com']
      },
      {
        title: 'Define QA test matrix',
        description: 'List regression scenarios for mobile and web, including edge cases.',
        status: TaskStatus.TODO,
        assignees: ['sofia.nguyen@example.com']
      },
      {
        title: 'Implement task filtering UI',
        description: 'Add status and assignee filters to the dashboard with loading states.',
        status: TaskStatus.IN_PROGRESS,
        assignees: ['noah.kim@example.com']
      },
      {
        title: 'Hook up activity feed API',
        description: 'Connect the feed component to the backend endpoint and handle pagination.',
        status: TaskStatus.IN_PROGRESS,
        assignees: ['ava.carter@example.com']
      },
      {
        title: 'Migrate legacy tasks',
        description: 'Import tasks from CSV and reconcile duplicates using email lookup.',
        status: TaskStatus.DONE,
        assignees: ['liam.patel@example.com']
      },
      {
        title: 'Tighten RBAC permissions',
        description: 'Review role matrix and restrict admin actions to privileged roles.',
        status: TaskStatus.DONE,
        assignees: ['sofia.nguyen@example.com']
      },
      {
        title: 'Optimize database indexes',
        description: 'Add missing indexes for task search queries and verify query plans.',
        status: TaskStatus.DONE,
        assignees: ['noah.kim@example.com']
      },
      {
        title: 'Refresh project documentation',
        description: 'Update README with local setup, scripts, and API examples.',
        status: TaskStatus.DONE,
        assignees: ['ava.carter@example.com']
      },
      {
        title: 'Plan incident response drill',
        description: 'Schedule tabletop exercise and document escalation paths.',
        status: TaskStatus.DONE,
        assignees: ['liam.patel@example.com', 'sofia.nguyen@example.com'] // only task with 2 assignees
      }
    ];

    for (const task of tasks) {
      const [insertedTask] = await queryRunner.query(
        `
          INSERT INTO "tasks" ("title", "description", "status")
          VALUES ($1, $2, $3)
          RETURNING id
        `,
        [task.title, task.description, task.status]
      );

      const taskId = insertedTask.id;
      for (const assigneeEmail of task.assignees) {
        const userId = userIdByEmail[assigneeEmail];
        if (!userId) continue;
        await queryRunner.query(
          `
            INSERT INTO "task_assignees" ("task_id", "user_id")
            VALUES ($1, $2)
          `,
          [taskId, userId]
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const taskTitles = [
      'Outline product requirements for sprint kickoff',
      'Create onboarding email templates',
      'Define QA test matrix',
      'Implement task filtering UI',
      'Hook up activity feed API',
      'Migrate legacy tasks',
      'Tighten RBAC permissions',
      'Optimize database indexes',
      'Refresh project documentation',
      'Plan incident response drill'
    ];

    await queryRunner.query(
      `DELETE FROM "task_assignees" WHERE "task_id" IN (SELECT id FROM "tasks" WHERE "title" = ANY($1))`,
      [taskTitles]
    );
    await queryRunner.query(`DELETE FROM "tasks" WHERE "title" = ANY($1)`, [taskTitles]);

    const userEmails = [
      'ava.carter@example.com',
      'liam.patel@example.com',
      'sofia.nguyen@example.com',
      'noah.kim@example.com'
    ];
    await queryRunner.query(`DELETE FROM "users" WHERE "email" = ANY($1)`, [userEmails]);
  }
}
