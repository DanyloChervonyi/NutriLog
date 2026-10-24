import { IsEnum } from 'class-validator';
import { MealType } from '../../../generated/prisma/enums.js';
import { DiaryDateDto } from './diary-date.dto.js';

export class CreateMealDto extends DiaryDateDto {
  @IsEnum(MealType)
  type!: MealType;
}
