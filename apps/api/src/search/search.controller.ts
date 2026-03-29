import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Full-text search across products and stores' })
  search(
    @Query('q') q: string,
    @Query('city_id') cityId: string,
    @Query('limit') limit?: number,
  ) {
    return this.searchService.search(q, cityId, undefined, +(limit || 20));
  }

  @Public()
  @Get('popular')
  @ApiOperation({ summary: 'Popular searches in a city' })
  popular(@Query('city_id') cityId: string) {
    return this.searchService.getPopularSearches(cityId);
  }
}
