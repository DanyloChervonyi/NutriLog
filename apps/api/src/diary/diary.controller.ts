import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { CreateMealDto } from './dto/create-meal.dto.js';
import { CreateMealItemDto } from './dto/create-meal-item.dto.js';
import { DiaryDateDto } from './dto/diary-date.dto.js';
import { UpdateMealDto } from './dto/update-meal.dto.js';
import { UpdateMealItemDto } from './dto/update-meal-item.dto.js';
import { DiaryService } from './diary.service.js';

@ApiTags('diary')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('diary')
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  @Get()
  get(@Req() request: AuthenticatedRequest, @Query() query: DiaryDateDto) {
    return this.diaryService.getDay(request.user.id, query.date);
  }

  @Post('meals')
  createMeal(@Req() request: AuthenticatedRequest, @Body() dto: CreateMealDto) {
    return this.diaryService.createMeal(request.user.id, dto);
  }

  @Patch('meals/:mealId')
  updateMeal(
    @Req() request: AuthenticatedRequest,
    @Param('mealId', ParseUUIDPipe) mealId: string,
    @Body() dto: UpdateMealDto,
  ) {
    return this.diaryService.updateMeal(request.user.id, mealId, dto.type);
  }

  @Delete('meals/:mealId')
  deleteMeal(
    @Req() request: AuthenticatedRequest,
    @Param('mealId', ParseUUIDPipe) mealId: string,
  ) {
    return this.diaryService.deleteMeal(request.user.id, mealId);
  }

  @Post('meals/:mealId/items')
  addItem(
    @Req() request: AuthenticatedRequest,
    @Param('mealId', ParseUUIDPipe) mealId: string,
    @Body() dto: CreateMealItemDto,
  ) {
    return this.diaryService.addItem(request.user.id, mealId, dto);
  }

  @Patch('meals/:mealId/items/:itemId')
  updateItem(
    @Req() request: AuthenticatedRequest,
    @Param('mealId', ParseUUIDPipe) mealId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateMealItemDto,
  ) {
    return this.diaryService.updateItem(request.user.id, mealId, itemId, dto);
  }

  @Delete('meals/:mealId/items/:itemId')
  deleteItem(
    @Req() request: AuthenticatedRequest,
    @Param('mealId', ParseUUIDPipe) mealId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.diaryService.deleteItem(request.user.id, mealId, itemId);
  }
}
