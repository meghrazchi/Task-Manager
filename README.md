# Task Manager Backend (NestJS + Postgres)

It demonstrates:

- NestJS with a feature-based modular architecture
- REST API with DTOs and validation
- PostgreSQL + TypeORM with migrations
- Docker & docker-compose setup
- Swagger/OpenAPI documentation
- Jest unit and e2e tests

---

## High-level Architecture

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: Postgres
- **ORM**: TypeORM (with migrations, no `synchronize`)
- **API style**: REST + Swagger docs
- **Testing**: Jest (unit + basic e2e)

### Structure

```text
src
├── main.ts                  # bootstrap / Swagger / global pipes & filters
├── app.module.ts            # root module
├── common                   # cross-cutting concerns
│   ├── dto
│   │   └── pagination-query.dto.ts
│   ├── filters
│   │   └── http-exception.filter.ts
│   └── interceptors
│       └── response.interceptor.ts
├── database
│   ├── typeorm.config.ts    # shared TypeORM config
│   └── data-source.ts       # TypeORM DataSource for migrations
├── modules
│   ├── tasks
│   │   ├── tasks.module.ts
│   │   ├── tasks.controller.ts
│   │   ├── tasks.service.ts
│   │   ├── domain
│   │   │   ├── task.entity.ts
│   │   │   └── task-status.enum.ts
│   │   └── dto
│   │       ├── assign-users.dto.ts
│   │       ├── create-task.dto.ts
│   │       └── update-task.dto.ts
│   └── users
│       ├── users.module.ts
│       ├── users.controller.ts
│       ├── users.service.ts
│       ├── domain
│       │   └── user.entity.ts
│       └── dto
│           └── create-user.dto.ts
└── migrations
    ├── 1710000000000-InitSchema.ts
    └── 1710000000001-SeedUsersAndTasks.ts
```

### Design choices

- **Feature modules (tasks, users)**: Scales better than strict layer-based modules.
- **DTOs**: Explicit request/response contracts with `class-validator`.
- **Service layer**: Encapsulates business use-cases (list, create, update, delete, assign).
- **Repositories (via TypeORM)**: Data access abstraction through injected repositories.
- **Global error filter + response interceptor**: Consistent response/envelope format.
- **Migrations instead of synchronize**: Closer to production reality and easier to reason about schema changes.

---

## Requirements

- Node.js >= 18 (repo uses Node 20 in Docker)
- Docker + Docker Compose
- (Optional) Local Postgres if you don't want Docker for DB

---

## Environment variables

See `.env.example`:

```bash
APP_PORT=3000
NODE_ENV=development

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=taskmanager
POSTGRES_PASSWORD=taskmanager
POSTGRES_DB=taskmanager
```

You can create a `.env` file in the project root, or set these in your shell / Docker compose.

---

## Running with Docker (recommended)

```bash
docker-compose up --build
```

This will:

- Start a Postgres container (port `5432`)
- Build the NestJS app image
- Run migrations on container startup
- Start the API on port `3000`

After it starts:

- API base URL: `http://localhost:3000`
- Swagger docs: `http://localhost:3000/api/docs`

> Note: `depends_on` in docker-compose ensures the DB container starts first, but not that it's *ready*. For a production setup you'd typically add a wait-for-it script or healthchecks before running migrations.

---

## Running locally (without Docker)

1. Install dependencies:

```bash
npm install
```

2. Start a local Postgres instance and configure `.env` as needed (see `.env.example`).

3. Run migrations (includes seed data for users and tasks):

```bash
npm run migration:run
```

4. Start the API:

```bash
npm run start:dev
# or
npm run start
```

---

## Database & Migrations

This project uses **TypeORM migrations** (no `synchronize`) so schema changes are explicit and versioned.

### Config

TypeORM configuration is centralized in `src/database/typeorm.config.ts` and reused by:

- NestJS via `TypeOrmModule.forRootAsync`
- CLI migrations via `src/database/data-source.ts`

Migrations live in `src/migrations`.

### Existing migration

`1710000000000-InitSchema.ts`:

- Creates `users` table
- Creates `tasks` table
- Creates `task_assignees` join table
- Adds indices on join table columns

`1710000000001-SeedUsersAndTasks.ts`:

- Seeds 4 users
- Seeds 10 tasks (3 `todo`, 2 `in_progress`, 5 `done`)
- Each task has at least one assignee; exactly one task has 2 assignees

### Migration commands

- Run migrations:

```bash
npm run migration:run
```

- Revert last migration:

```bash
npm run migration:revert
```

- Generate new migration (example):

```bash
npm run migration:generate
# then rename the generated file appropriately
```

> In a real project you would give a descriptive name instead of `auto-migration` and commit the generated file.

---

## API Overview

### Users

- `POST /users`
  - Create a user
  - Body: `{ "name": "Alice", "email": "alice@example.com" }`

- `GET /users`
  - List all users

### Tasks

- `GET /tasks`
  - Query params:
    - `status?: todo | in_progress | done`
    - `assigneeId?: string`
    - `search?: string`
    - `limit?: number` (default 50)
    - `offset?: number` (default 0)

- `GET /tasks/:id`
  - Get a single task by ID

- `POST /tasks`
  - Body:
    ```json
    {
      "title": "Implement login page",
      "description": "Implement login with email and password",
      "status": "todo",
      "dueDate": "2025-11-30T12:00:00.000Z"
    }
    ```

- `PATCH /tasks/:id`
  - Partial update of task fields (same shape as `POST /tasks`, all fields optional)

- `DELETE /tasks/:id`
  - Deletes a task

- `POST /tasks/:id/assignees`
  - Assign users to a task (replaces existing assignees)
  - Body:
    ```json
    {
      "userIds": ["<uuid-of-user-1>", "<uuid-of-user-2>"]
    }
    ```

---

## Swagger / API Docs

Once the app is running:

- Navigate to `http://localhost:3000/api/docs`

The Swagger UI is generated with `@nestjs/swagger` decorators on:

- Controllers (`@ApiTags`, `@ApiOperation`, `@ApiOkResponse`, etc.)
- DTOs / entities (`@ApiProperty`, `@ApiPropertyOptional`)

This gives a live, interactive API reference.

---

## Testing

Jest is used for both unit and e2e testing.

- Unit tests:

```bash
npm test
```

- Watch mode:

```bash
npm run test:watch
```

- e2e tests:

```bash
npm run test:e2e
```

Example tests:

- `src/modules/tasks/tasks.service.spec.ts`: Unit test for `TasksService` using mocked repositories.
- `test/app.e2e-spec.ts`: Minimal e2e setup, hitting `/tasks`.

---

Key points:

- **Architecture**: Feature-based modules, clean separation between controllers/services/entities, DTOs for boundaries.
- **Persistence**: TypeORM repositories + migrations, no `synchronize`, Postgres choice for relational data and joins.
- **Docker**: One command (`docker-compose up --build`) to run the whole stack.
- **Swagger**: Self-documenting endpoints, easy for frontend or external consumers.
- **Testing**: Service-level unit tests + e2e skeleton; mention how you'd extend coverage in a real project.

We can also talk about possible improvements you'd make with more time:

- Add authentication/authorization (JWT) and per-user task ownership.
- Add better search/sorting, pagination metadata, and cursor-based pagination for large datasets.
- Add healthcheck endpoints and proper DB readiness checks in Docker.
- Split read/write operations (CQRS) if complexity grows.

---
