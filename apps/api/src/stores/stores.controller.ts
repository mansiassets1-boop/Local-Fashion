import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { OnboardSellerDto, UpdateStoreDto } from './dto/stores.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Stores')
@Controller()
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Public()
  @Get('stores/:id')
  @ApiOperation({ summary: 'Store profile with stats' })
  findOne(@Param('id') id: string) {
    return this.storesService.findById(id);
  }

  @Public()
  @Get('stores/:id/products')
  @ApiOperation({ summary: 'Store products with filters' })
  getStoreProducts(@Param('id') id: string, @Query() query: any) {
    return this.storesService.getStoreProducts(id, query);
  }

  @UseGuards(JwtAuthGuard)
  @Post('stores/:id/follow')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow a store' })
  follow(@CurrentUser('id') userId: string, @Param('id') storeId: string) {
    return this.storesService.followStore(userId, storeId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('stores/:id/follow')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unfollow a store' })
  unfollow(@CurrentUser('id') userId: string, @Param('id') storeId: string) {
    return this.storesService.unfollowStore(userId, storeId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('seller/onboard')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seller onboarding — create store (status: pending)' })
  onboard(
    @CurrentUser('id') userId: string,
    @CurrentUser('city_id') cityId: string,
    @Body() dto: OnboardSellerDto,
  ) {
    return this.storesService.onboardSeller(userId, cityId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  @Patch('seller/store')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seller: update own store' })
  updateStore(@CurrentUser('id') userId: string, @Body() dto: UpdateStoreDto) {
    return this.storesService.updateStore(userId, dto);
  }
}
