import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Task } from '../modules/tasks/domain/task.entity';
import { User } from '../modules/users/domain/user.entity';

export const getTypeOrmConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER || 'taskmanager',
  password: process.env.POSTGRES_PASSWORD || 'taskmanager',
  database: process.env.POSTGRES_DB || 'taskmanager',
  entities: [Task, User],
  synchronize: false,
  logging: false
});
