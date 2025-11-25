import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { User } from '../../users/domain/user.entity';
import { TaskStatus } from './task-status.enum';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tasks')
export class Task {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty()
  @Column()
  title!: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true, type: 'text' })
  description?: string | null;

  @ApiProperty({ enum: TaskStatus, default: TaskStatus.TODO })
  @Column({ type: 'varchar', default: TaskStatus.TODO })
  status!: TaskStatus;

  @ApiProperty({ required: false, type: String, format: 'date-time' })
  @Column({ nullable: true, type: 'timestamp with time zone' })
  dueDate?: Date | null;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @ApiProperty({ type: () => [User] })
  @ManyToMany(() => User, (user) => user.tasks, { eager: true })
  @JoinTable({
    name: 'task_assignees',
    joinColumn: {
      name: 'task_id',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'user_id',
      referencedColumnName: 'id'
    }
  })
  assignees!: User[];
}
