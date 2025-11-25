import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Alice Doe' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  email!: string;
}
