import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { getTypeOrmConfig } from './typeorm.config';

dotenv.config();

export default new DataSource({
  ...(getTypeOrmConfig() as any),
  migrations: ['src/migrations/*.ts']
});
