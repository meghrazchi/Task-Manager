import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class AssignUsersDto {
  @ApiProperty({
    example: ['uuid-of-user-1', 'uuid-of-user-2'],
    type: [String]
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  userIds!: string[];
}
