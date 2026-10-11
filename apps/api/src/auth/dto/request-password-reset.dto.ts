import { IsEmail, IsIn, IsOptional, MaxLength } from 'class-validator';

export class RequestPasswordResetDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsOptional()
  @IsIn(['ru', 'uk', 'en'])
  locale?: 'ru' | 'uk' | 'en';
}
