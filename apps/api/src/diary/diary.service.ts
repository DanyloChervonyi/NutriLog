import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MealType, Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateMealDto } from './dto/create-meal.dto.js';
import type { CreateMealItemDto } from './dto/create-meal-item.dto.js';
import type { UpdateMealItemDto } from './dto/update-meal-item.dto.js';

const FOOD_NUTRIENTS = {
  id: true,
  calories: true,
  protein: true,
  fat: true,
  carbs: true,
  fiber: true,
  sugar: true,
  potassium: true,
  magnesium: true,
  iron: true,
  calcium: true,
  vitaminA: true,
  vitaminC: true,
  vitaminD: true,
} as const;

type FoodNutrients = Prisma.FoodGetPayload<{ select: typeof FOOD_NUTRIENTS }>;
type DiaryTransaction = Prisma.TransactionClient;

@Injectable()
export class DiaryService {
  constructor(private readonly prisma: PrismaService) {}

  async getDay(userId: string, dateInput: string) {
    const entryDate = parseDate(dateInput);
    const [day, profile] = await Promise.all([
      this.prisma.diaryDay.findUnique({
        where: { userId_entryDate: { userId, entryDate } },
        include: {
          meals: {
            orderBy: [{ type: 'asc' }, { createdAt: 'asc' }],
            include: {
              items: {
                orderBy: { createdAt: 'asc' },
                include: { food: { select: { id: true, name: true, brand: true } } },
              },
            },
          },
        },
      }),
      this.prisma.userProfile.findUnique({
        where: { userId },
        select: {
          dailyCaloriesGoal: true,
          proteinGoal: true,
          fatGoal: true,
          carbsGoal: true,
        },
      }),
    ]);

    return {
      date: dateInput,
      totals: {
        calories: day?.totalCalories ?? 0,
        protein: Number(day?.totalProtein ?? 0),
        fat: Number(day?.totalFat ?? 0),
        carbs: Number(day?.totalCarbs ?? 0),
      },
      goals: profile
        ? {
            calories: profile.dailyCaloriesGoal,
            protein: profile.proteinGoal === null ? null : Number(profile.proteinGoal),
            fat: profile.fatGoal === null ? null : Number(profile.fatGoal),
            carbs: profile.carbsGoal === null ? null : Number(profile.carbsGoal),
          }
        : null,
      meals: (day?.meals ?? []).map((meal) => ({
        id: meal.id,
        type: meal.type,
        items: meal.items.map((item) => ({
          id: item.id,
          food: item.food,
          grams: Number(item.grams),
          calories: item.calories,
          protein: Number(item.protein),
          fat: Number(item.fat),
          carbs: Number(item.carbs),
        })),
      })),
    };
  }

  async createMeal(userId: string, input: CreateMealDto) {
    const entryDate = parseDate(input.date);
    await this.prisma.$transaction(async (transaction) => {
      const day = await this.ensureDay(transaction, userId, entryDate);
      await transaction.meal.create({ data: { diaryDayId: day.id, type: input.type } });
    });
    return this.getDay(userId, input.date);
  }

  async updateMeal(userId: string, mealId: string, type: MealType) {
    const meal = await this.findOwnedMeal(this.prisma, userId, mealId);
    await this.prisma.meal.update({ where: { id: meal.id }, data: { type } });
    return this.getDay(userId, formatDate(meal.diaryDay.entryDate));
  }

  async deleteMeal(userId: string, mealId: string) {
    const meal = await this.findOwnedMeal(this.prisma, userId, mealId);
    await this.prisma.$transaction(async (transaction) => {
      await transaction.meal.delete({ where: { id: meal.id } });
      await this.updateDayTotals(transaction, meal.diaryDayId);
    });
    return this.getDay(userId, formatDate(meal.diaryDay.entryDate));
  }

  async addItem(userId: string, mealId: string, input: CreateMealItemDto) {
    const meal = await this.findOwnedMeal(this.prisma, userId, mealId);
    await this.prisma.$transaction(async (transaction) => {
      const food = await this.findFood(transaction, input.foodId);
      await transaction.mealItem.create({
        data: { mealId, foodId: food.id, grams: input.grams, ...nutritionSnapshot(food, input.grams) },
      });
      await this.updateDayTotals(transaction, meal.diaryDayId);
    });
    return this.getDay(userId, formatDate(meal.diaryDay.entryDate));
  }

  async updateItem(userId: string, mealId: string, itemId: string, input: UpdateMealItemDto) {
    const meal = await this.findOwnedMeal(this.prisma, userId, mealId);
    await this.prisma.$transaction(async (transaction) => {
      const item = await transaction.mealItem.findFirst({
        where: { id: itemId, mealId },
      });
      if (!item) throw new NotFoundException('Diary item not found');

      const snapshot = input.foodId
        ? nutritionSnapshot(await this.findFood(transaction, input.foodId), input.grams)
        : scaleSnapshot(item, Number(item.grams), input.grams);
      await transaction.mealItem.update({
        where: { id: item.id },
        data: {
          ...(input.foodId ? { foodId: input.foodId } : {}),
          grams: input.grams,
          ...snapshot,
        },
      });
      await this.updateDayTotals(transaction, meal.diaryDayId);
    });
    return this.getDay(userId, formatDate(meal.diaryDay.entryDate));
  }

  async deleteItem(userId: string, mealId: string, itemId: string) {
    const meal = await this.findOwnedMeal(this.prisma, userId, mealId);
    await this.prisma.$transaction(async (transaction) => {
      const item = await transaction.mealItem.findFirst({ where: { id: itemId, mealId } });
      if (!item) throw new NotFoundException('Diary item not found');
      await transaction.mealItem.delete({ where: { id: item.id } });
      await this.updateDayTotals(transaction, meal.diaryDayId);
    });
    return this.getDay(userId, formatDate(meal.diaryDay.entryDate));
  }

  private async ensureDay(transaction: DiaryTransaction, userId: string, entryDate: Date) {
    return transaction.diaryDay.upsert({
      where: { userId_entryDate: { userId, entryDate } },
      create: { userId, entryDate },
      update: {},
    });
  }

  private async findOwnedMeal(client: PrismaService | DiaryTransaction, userId: string, mealId: string) {
    const meal = await client.meal.findFirst({
      where: { id: mealId, diaryDay: { userId } },
      include: { diaryDay: { select: { id: true, userId: true, entryDate: true } } },
    });
    if (!meal) throw new NotFoundException('Meal not found');
    return { id: meal.id, diaryDayId: meal.diaryDay.id, diaryDay: meal.diaryDay };
  }

  private async findFood(transaction: DiaryTransaction, foodId: string) {
    const food = await transaction.food.findFirst({
      where: { id: foodId, isVerified: true },
      select: FOOD_NUTRIENTS,
    });
    if (!food) throw new NotFoundException('Verified food not found');
    return food;
  }

  private async updateDayTotals(transaction: DiaryTransaction, diaryDayId: string) {
    // Serialize total refreshes so concurrent item changes cannot leave stale daily sums.
    await transaction.$queryRaw(Prisma.sql`
      SELECT id FROM diary_days WHERE id = ${diaryDayId}::uuid FOR UPDATE
    `);
    const totals = await transaction.mealItem.aggregate({
      where: { meal: { is: { diaryDayId } } },
      _sum: { calories: true, protein: true, fat: true, carbs: true },
    });
    await transaction.diaryDay.update({
      where: { id: diaryDayId },
      data: {
        totalCalories: totals._sum.calories ?? 0,
        totalProtein: totals._sum.protein ?? 0,
        totalFat: totals._sum.fat ?? 0,
        totalCarbs: totals._sum.carbs ?? 0,
      },
    });
  }
}

function parseDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new BadRequestException('Date must use YYYY-MM-DD format');
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (formatDate(date) !== value) throw new BadRequestException('Date is invalid');
  return date;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function nutritionSnapshot(food: FoodNutrients, grams: number) {
  const ratio = grams / 100;
  return {
    calories: Math.round(Number(food.calories) * ratio),
    protein: round(Number(food.protein) * ratio, 2),
    fat: round(Number(food.fat) * ratio, 2),
    carbs: round(Number(food.carbs) * ratio, 2),
    fiber: scaleOptional(food.fiber, ratio, 2),
    sugar: scaleOptional(food.sugar, ratio, 2),
    potassium: scaleOptional(food.potassium, ratio, 3),
    magnesium: scaleOptional(food.magnesium, ratio, 3),
    iron: scaleOptional(food.iron, ratio, 3),
    calcium: scaleOptional(food.calcium, ratio, 3),
    vitaminA: scaleOptional(food.vitaminA, ratio, 3),
    vitaminC: scaleOptional(food.vitaminC, ratio, 3),
    vitaminD: scaleOptional(food.vitaminD, ratio, 3),
  };
}

function scaleSnapshot(
  item: {
    calories: number;
    protein: Prisma.Decimal;
    fat: Prisma.Decimal;
    carbs: Prisma.Decimal;
    fiber: Prisma.Decimal | null;
    sugar: Prisma.Decimal | null;
    potassium: Prisma.Decimal | null;
    magnesium: Prisma.Decimal | null;
    iron: Prisma.Decimal | null;
    calcium: Prisma.Decimal | null;
    vitaminA: Prisma.Decimal | null;
    vitaminC: Prisma.Decimal | null;
    vitaminD: Prisma.Decimal | null;
  },
  oldGrams: number,
  newGrams: number,
) {
  const ratio = newGrams / oldGrams;
  return {
    calories: Math.round(item.calories * ratio),
    protein: round(Number(item.protein) * ratio, 2),
    fat: round(Number(item.fat) * ratio, 2),
    carbs: round(Number(item.carbs) * ratio, 2),
    fiber: scaleOptional(item.fiber, ratio, 2),
    sugar: scaleOptional(item.sugar, ratio, 2),
    potassium: scaleOptional(item.potassium, ratio, 3),
    magnesium: scaleOptional(item.magnesium, ratio, 3),
    iron: scaleOptional(item.iron, ratio, 3),
    calcium: scaleOptional(item.calcium, ratio, 3),
    vitaminA: scaleOptional(item.vitaminA, ratio, 3),
    vitaminC: scaleOptional(item.vitaminC, ratio, 3),
    vitaminD: scaleOptional(item.vitaminD, ratio, 3),
  };
}

function scaleOptional(value: Prisma.Decimal | null, ratio: number, digits: number): number | null {
  return value === null ? null : round(Number(value) * ratio, digits);
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
