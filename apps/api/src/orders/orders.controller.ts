import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, Req, Headers, RawBodyRequest, HttpCode, HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto, UpdateOrderStatusDto, CancelOrderDto, ReturnOrderDto, OrdersQueryDto,
} from './dto/orders.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create order, initiate Razorpay payment' })
  createOrder(
    @CurrentUser('id') userId: string,
    @CurrentUser('city_id') cityId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(userId, cityId, dto);
  }

  @Public()
  @Post('webhook/razorpay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Razorpay payment webhook (no JWT required)' })
  razorpayWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const raw = (req as any).rawBody || Buffer.from(JSON.stringify(req.body));
    return this.ordersService.handleWebhook(raw, signature);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buyer order history' })
  getUserOrders(@CurrentUser('id') userId: string, @Query() query: OrdersQueryDto) {
    return this.ordersService.getUserOrders(userId, query);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Order detail with timeline' })
  getOrderDetail(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.ordersService.getOrderById(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/location')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Latest delivery partner GPS for order' })
  getLocation(@Param('id') id: string) {
    return this.ordersService.getOrderLocation(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller', 'delivery', 'admin')
  @Patch(':id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order status (role-validated)' })
  updateStatus(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(id, userId, userRole, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel order (before assigned status)' })
  cancelOrder(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.ordersService.cancelOrder(id, userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/return')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create return request' })
  returnOrder(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ReturnOrderDto,
  ) {
    return this.ordersService.createReturnRequest(id, userId, dto);
  }
}
