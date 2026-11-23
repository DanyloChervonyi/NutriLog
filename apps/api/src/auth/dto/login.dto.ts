import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'nutri_user or user@example.com', maxLength: 320 })
  @IsString()
  @MinLength(3)
  @MaxLength(320)
  identifier!: string;

  @ApiProperty({ minLength: 1, maxLength: 128, format: 'password' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}
