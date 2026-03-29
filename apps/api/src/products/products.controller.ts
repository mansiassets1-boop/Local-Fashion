import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import {
  CreateProductDto, UpdateProductDto, ProductsQueryDto, AddVariantDto, UpdateStockDto,
} from './dto/products.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Products')
@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get('products')
  @ApiOperation({ summary: 'Paginated product listing with filters' })
  findAll(@Query() query: ProductsQueryDto) {
    return this.productsService.findAll(query);
  }

  @Public()
  @Get('products/:id')
  @ApiOperation({ summary: 'Full product detail with variants, images, similar products' })
  findOne(@Param('id') id: string, @Query('city_id') cityId?: string) {
    return this.productsService.findById(id, cityId);
  }

  @Public()
  @Get('products/:id/availability')
  @ApiOperation({ summary: 'Real-time variant stock levels' })
  getAvailability(@Param('id') id: string) {
    return this.productsService.getVariantAvailability(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  @Post('products')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seller: create product with variants + images' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateProductDto) {
    return this.productsService.create(userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  @Patch('products/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seller: update product' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  @Delete('products/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seller: deactivate product' })
  deactivate(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.productsService.deactivate(id, userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  @Post('seller/variants')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seller: add variant to product' })
  addVariant(@CurrentUser('id') userId: string, @Body() dto: AddVariantDto) {
    return this.productsService.addVariant(userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  @Patch('seller/variants/:id/stock')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seller: update variant stock' })
  updateStock(
    @Param('id') variantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateStockDto,
  ) {
    return this.productsService.updateVariantStock(variantId, userId, dto);
  }
}
