import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CitiesService } from './cities.service';
import { CreateCityDto, UpdateCityDto, HomeQueryDto } from './dto/cities.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Cities')
@Controller()
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Public()
  @Get('cities')
  @ApiOperation({ summary: 'List all active cities' })
  findAll() {
    return this.citiesService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('cities')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: create city' })
  create(@Body() dto: CreateCityDto) {
    return this.citiesService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('cities/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: update city' })
  update(@Param('id') id: string, @Body() dto: UpdateCityDto) {
    return this.citiesService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('home')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Home screen data: banners, trending, new arrivals, nearby stores' })
  getHome(
    @Query('city_id') cityId: string,
    @Query('lat') lat?: number,
    @Query('lng') lng?: number,
  ) {
    return this.citiesService.getHomeData(cityId, lat ? +lat : undefined, lng ? +lng : undefined);
  }
}
