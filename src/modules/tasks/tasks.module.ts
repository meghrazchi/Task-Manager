import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './domain/task.entity';
import { User } from '../users/domain/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, User])],
  providers: [TasksService],
  controllers: [TasksController]
})
export class TasksModule {}
