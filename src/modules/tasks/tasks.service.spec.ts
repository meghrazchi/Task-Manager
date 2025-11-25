import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { TasksService } from './tasks.service';
import { Task } from './domain/task.entity';
import { User } from '../users/domain/user.entity';
import { TaskStatus } from './domain/task-status.enum';
import { NotFoundException } from '@nestjs/common';

type MockRepo<T extends ObjectLiteral = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepo = <T extends ObjectLiteral = any>(): MockRepo<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  findByIds: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn()
});

const makeTask = (overrides: Partial<Task> = {}): Task =>
  ({
    id: 'task-id',
    title: 'Test task',
    status: TaskStatus.TODO,
    createdAt: new Date(),
    updatedAt: new Date(),
    assignees: [],
    ...overrides
  } as Task);

describe('TasksService', () => {
  let service: TasksService;
  let tasksRepo: MockRepo<Task>;
  let usersRepo: MockRepo<User>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: createMockRepo()
        },
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepo()
        }
      ]
    }).compile();

    service = moduleRef.get<TasksService>(TasksService);
    tasksRepo = moduleRef.get<MockRepo<Task>>(getRepositoryToken(Task));
    usersRepo = moduleRef.get<MockRepo<User>>(getRepositoryToken(User));
  });

  it('should create a task with default status', async () => {
    const dto = { title: 'Test task' };

    const task = { id: '1', title: 'Test task', status: TaskStatus.TODO } as Task;
    tasksRepo.create!.mockReturnValue(task);
    tasksRepo.save!.mockResolvedValue(task);

    const result = await service.create(dto as any);

    expect(tasksRepo.create).toHaveBeenCalledWith({
      ...dto,
      status: TaskStatus.TODO,
      dueDate: undefined
    });
    expect(result.status).toBe(TaskStatus.TODO);
  });

  it('should create a task with provided status and dueDate', async () => {
    const dto = { title: 'Test task', status: TaskStatus.IN_PROGRESS, dueDate: '2024-01-01' };
    const createdTask = { id: '1', ...dto, dueDate: new Date(dto.dueDate) } as Task;

    tasksRepo.create!.mockReturnValue(createdTask);
    tasksRepo.save!.mockResolvedValue(createdTask);

    const result = await service.create(dto as any);

    expect(tasksRepo.create).toHaveBeenCalledWith({
      ...dto,
      dueDate: new Date(dto.dueDate)
    });
    expect(result.status).toBe(TaskStatus.IN_PROGRESS);
  });

  it('should list tasks with filters applied', async () => {
    const qb: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[{ id: '1' } as Task], 1])
    };
    tasksRepo.createQueryBuilder!.mockReturnValue(qb);

    const filters = { status: TaskStatus.TODO, assigneeId: 'u1', search: 'test', limit: 10, offset: 5 };
    const [items, total] = await service.list(filters);

    expect(tasksRepo.createQueryBuilder).toHaveBeenCalledWith('task');
    expect(qb.andWhere).toHaveBeenCalledWith('task.status = :status', { status: filters.status });
    expect(qb.andWhere).toHaveBeenCalledWith('assignees.id = :assigneeId', { assigneeId: filters.assigneeId });
    expect(qb.andWhere).toHaveBeenCalledWith(
      '(task.title ILIKE :search OR task.description ILIKE :search)',
      { search: `%${filters.search}%` }
    );
    expect(qb.skip).toHaveBeenCalledWith(filters.offset);
    expect(qb.take).toHaveBeenCalledWith(filters.limit);
    expect(items).toHaveLength(1);
    expect(total).toBe(1);
  });

  it('should find one task or throw', async () => {
    const task = { id: '1' } as Task;
    tasksRepo.findOne!.mockResolvedValue(task);

    const result = await service.findOne('1');
    expect(result).toBe(task);

    tasksRepo.findOne!.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should update a task converting dueDate', async () => {
    const task = { id: '1', title: 'Old' } as Task;
    jest.spyOn(service, 'findOne').mockResolvedValue(task);
    tasksRepo.save!.mockImplementation(async (t) => t as Task);

    const dto = { title: 'New', dueDate: '2024-01-02' };
    const result = await service.update('1', dto as any);

    expect(service.findOne).toHaveBeenCalledWith('1');
    expect(result.title).toBe('New');
    expect(result.dueDate).toEqual(new Date(dto.dueDate));
  });

  it('should delete a task and throw when not found', async () => {
    tasksRepo.delete!.mockResolvedValue({ affected: 1 });
    await service.delete('1');
    expect(tasksRepo.delete).toHaveBeenCalledWith('1');

    tasksRepo.delete!.mockResolvedValue({ affected: 0 });
    await expect(service.delete('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should assign users replacing existing assignees', async () => {
    const task = makeTask({ id: '1', assignees: [] });
    jest.spyOn(service, 'findOne').mockResolvedValue(task);
    const users = [{ id: 'u1' }, { id: 'u2' }] as User[];
    usersRepo.findByIds!.mockResolvedValue(users);
    tasksRepo.save!.mockImplementation(async (t) => t as Task);

    const result = await service.assignUsers('1', { userIds: ['u1', 'u2'] });

    expect(service.findOne).toHaveBeenCalledWith('1');
    expect(usersRepo.findByIds).toHaveBeenCalledWith(['u1', 'u2']);
    expect(result.assignees).toEqual(users);
  });

  it('should throw when assigning users that do not exist', async () => {
    jest.spyOn(service, 'findOne').mockResolvedValue(makeTask({ id: '1', assignees: [] }));
    usersRepo.findByIds!.mockResolvedValue([{ id: 'u1' } as User]);

    await expect(service.assignUsers('1', { userIds: ['u1', 'u2'] })).rejects.toBeInstanceOf(NotFoundException);
  });
});
