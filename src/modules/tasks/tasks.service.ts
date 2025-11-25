import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './domain/task.entity';
import { TaskStatus } from './domain/task-status.enum';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AssignUsersDto } from './dto/assign-users.dto';
import { User } from '../users/domain/user.entity';

interface ListTasksFilters {
  status?: TaskStatus;
  assigneeId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepo: Repository<Task>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>
  ) {}

  async list(filters: ListTasksFilters): Promise<[Task[], number]> {
    const { status, assigneeId, search, limit = 50, offset = 0 } = filters;

    const query = this.tasksRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignees', 'assignees')
      .skip(offset)
      .take(limit)
      .orderBy('task.createdAt', 'DESC');

    if (status) {
      query.andWhere('task.status = :status', { status });
    }

    if (assigneeId) {
      query.andWhere('assignees.id = :assigneeId', { assigneeId });
    }

    if (search) {
      query.andWhere(
        '(task.title ILIKE :search OR task.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [items, count] = await query.getManyAndCount();
    return [items, count];
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.tasksRepo.findOne({
      where: { id },
      relations: { assignees: true }
    });
    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }
    return task;
  }

  async create(dto: CreateTaskDto): Promise<Task> {
    const task = this.tasksRepo.create({
      ...dto,
      status: dto.status ?? TaskStatus.TODO,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined
    });
    return this.tasksRepo.save(task);
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);

    const updated = {
      ...dto,
      ...(dto.dueDate !== undefined
        ? { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }
        : {})
    };

    Object.assign(task, updated);
    return this.tasksRepo.save(task);
  }

  async delete(id: string): Promise<void> {
    const result = await this.tasksRepo.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Task ${id} not found`);
    }
  }

  async assignUsers(taskId: string, dto: AssignUsersDto): Promise<Task> {
    const task = await this.findOne(taskId);
    const users = await this.usersRepo.findByIds(dto.userIds);

    if (users.length !== dto.userIds.length) {
      throw new NotFoundException('One or more users not found');
    }

    task.assignees = users;
    return this.tasksRepo.save(task);
  }
}
