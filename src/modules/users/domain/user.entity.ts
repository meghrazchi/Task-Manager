import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Task } from '../../tasks/domain/task.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('users')
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty()
  @Column()
  name!: string;

  @ApiProperty()
  @Column({ unique: true })
  email!: string;

  @ManyToMany(() => Task, (task) => task.assignees)
  tasks!: Task[];
}
