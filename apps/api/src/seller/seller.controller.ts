import {
  Controller, Get, Patch, Post, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SellerService } from './seller.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IsOptional, IsString } from 'class-validator';

class SellerOrderActionDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

@ApiTags('Seller')
@Controller('seller')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('seller')
@ApiBearerAuth()
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  @Get('orders')
  @ApiOperation({ summary: 'Seller orders with SLA timers' })
  getOrders(@CurrentUser('id') userId: string, @Query() query: any) {
    return this.sellerService.getOrders(userId, query);
  }

  @Patch('orders/:id/accept')
  @ApiOperation({ summary: 'Accept order' })
  acceptOrder(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.sellerService.acceptOrder(id, userId);
  }

  @Patch('orders/:id/reject')
  @ApiOperation({ summary: 'Reject order' })
  rejectOrder(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SellerOrderActionDto,
  ) {
    return this.sellerService.rejectOrder(id, userId, dto.reason);
  }

  @Patch('orders/:id/ready')
  @ApiOperation({ summary: 'Mark order ready for pickup → triggers delivery assignment' })
  markReady(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.sellerService.markReady(id, userId);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Store sales analytics' })
  getAnalytics(@CurrentUser('id') userId: string) {
    return this.sellerService.getAnalytics(userId);
  }

  @Get('payouts')
  @ApiOperation({ summary: 'Payout history and pending amount' })
  getPayouts(@CurrentUser('id') userId: string) {
    return this.sellerService.getPayouts(userId);
  }
}
