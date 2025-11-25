import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ParseUUIDPipe
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AssignUsersDto } from './dto/assign-users.dto';
import { TaskStatus } from './domain/task-status.enum';
import { Task } from './domain/task.entity';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'List tasks with optional filters' })
  @ApiOkResponse({ type: Task, isArray: true })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
  async list(@Query() query: ListTasksQueryDto) {
    const { status, assigneeId, search, limit = 50, offset = 0 } = query;

    const [items, total] = await this.tasksService.list({
      status,
      assigneeId,
      search,
      limit,
      offset
    });

    return {
      success: true,
      data: items,
      meta: {
        total,
        limit,
        offset
      }
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single task' })
  @ApiOkResponse({ type: Task })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.tasksService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiCreatedResponse({ type: Task })
  create(@Body() dto: CreateTaskDto) {
    return this.tasksService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing task' })
  @ApiOkResponse({ type: Task })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateTaskDto
  ) {
    return this.tasksService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiOkResponse({ schema: { example: { message: 'Task deleted' } } })
  async delete(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.tasksService.delete(id);
    return { message: 'Task deleted' };
  }

  @Post(':id/assignees')
  @ApiOperation({ summary: 'Assign users to a task (replaces existing assignees)' })
  @ApiOkResponse({ type: Task })
  assignUsers(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AssignUsersDto
  ) {
    return this.tasksService.assignUsers(id, dto);
  }
}
