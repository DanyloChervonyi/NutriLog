import { Controller, Get, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { SearchFoodsDto } from './dto/search-foods.dto.js';
import { FoodsService } from './foods.service.js';

@ApiTags('foods')
@Controller('foods')
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  @Get('search')
  @ApiQuery({ name: 'q', required: true, minLength: 2, maxLength: 200 })
  search(@Query() query: SearchFoodsDto) {
    return this.foodsService.search(query);
  }
}
