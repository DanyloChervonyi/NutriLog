import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class UpdateMealItemDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(0.01)
  @Max(50000)
  grams!: number;

  @IsOptional()
  @IsUUID()
  foodId?: string;
}
