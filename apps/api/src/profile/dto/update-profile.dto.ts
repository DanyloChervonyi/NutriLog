import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, Max, Min } from 'class-validator';
import { ActivityLevel, Gender, Goal } from '../../../generated/prisma/enums.js';

export class UpdateProfileDto {
  @IsEnum(Gender)
  gender!: Gender;

  @Type(() => Number)
  @IsInt()
  @Min(13)
  @Max(120)
  age!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(100)
  @Max(250)
  heightCm!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(25)
  @Max(350)
  weightKg!: number;

  @IsEnum(Goal)
  goal!: Goal;

  @IsEnum(ActivityLevel)
  activityLevel!: ActivityLevel;
}
