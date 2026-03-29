import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/ratings.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Ratings')
@Controller()
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('ratings')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buyer submits rating after delivery' })
  createRating(@CurrentUser('id') userId: string, @Body() dto: CreateRatingDto) {
    return this.ratingsService.createRating(userId, dto);
  }

  @Public()
  @Get('products/:id/ratings')
  @ApiOperation({ summary: 'Paginated reviews for a product' })
  getProductRatings(
    @Param('id') productId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ratingsService.getProductRatings(productId, +(page || 1), +(limit || 20));
  }
}
