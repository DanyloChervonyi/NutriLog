import { IsEnum } from 'class-validator';
import { MealType } from '../../../generated/prisma/enums.js';

export class UpdateMealDto {
  @IsEnum(MealType)
  type!: MealType;
}
