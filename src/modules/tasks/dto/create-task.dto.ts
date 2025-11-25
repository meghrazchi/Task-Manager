import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TaskStatus } from '../domain/task-status.enum';

export class CreateTaskDto {
  @ApiProperty({ example: 'Implement login page' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'Implement login with email and password.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.TODO })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
