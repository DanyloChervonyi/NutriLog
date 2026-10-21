import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisCacheService } from '../redis-cache/redis-cache.service.js';
import type { SearchFoodsDto } from './dto/search-foods.dto.js';

const FOOD_SELECT = {
  id: true,
  name: true,
  brand: true,
  category: true,
  calories: true,
  protein: true,
  fat: true,
  carbs: true,
  fiber: true,
  sugar: true,
} as const;
const SEARCH_CACHE_TTL_SECONDS = 60;

type FoodSearchItem = {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number | null;
  sugar: number | null;
};

type FoodSearchResponse = {
  items: FoodSearchItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

type FoodRow = Awaited<ReturnType<PrismaService['food']['findMany']>>[number];

@Injectable()
export class FoodsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {}

  async search(input: SearchFoodsDto) {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 20;
    const query = input.q.trim().toLowerCase();
    const cacheKey = 'foods:search:v1:' + JSON.stringify([query, page, pageSize]);
    const cached = await this.cache.get<FoodSearchResponse>(cacheKey);
    if (cached) return cached;

    const result = await this.searchFromDatabase(query, page, pageSize);
    await this.cache.set(cacheKey, result, SEARCH_CACHE_TTL_SECONDS);
    return result;
  }

  private async searchFromDatabase(
    query: string,
    page: number,
    pageSize: number,
  ): Promise<FoodSearchResponse> {
    const where = {
      isVerified: true,
      name: { contains: query, mode: 'insensitive' as const },
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.food.findMany({
        where,
        select: FOOD_SELECT,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.food.count({ where }),
    ]);

    return {
      items: rows.map((food) => this.toResponse(food)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  private toResponse(food: Pick<FoodRow, keyof typeof FOOD_SELECT>): FoodSearchItem {
    return {
      id: food.id,
      name: food.name,
      brand: food.brand,
      category: food.category,
      calories: Number(food.calories),
      protein: Number(food.protein),
      fat: Number(food.fat),
      carbs: Number(food.carbs),
      fiber: food.fiber === null ? null : Number(food.fiber),
      sugar: food.sugar === null ? null : Number(food.sugar),
    };
  }
}
