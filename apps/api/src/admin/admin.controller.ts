import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import {
  ApproveSellerDto, SuspendSellerDto, AdminRefundDto, BroadcastDto, AdminOrdersQueryDto,
} from './dto/admin.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Real-time platform KPIs' })
  getMetrics() {
    return this.adminService.getMetrics();
  }

  @Get('sellers')
  @ApiOperation({ summary: 'All sellers with filters' })
  getSellers(@Query() query: any) {
    return this.adminService.getSellers(query);
  }

  @Patch('sellers/:id/approve')
  @ApiOperation({ summary: 'Approve seller + send SMS' })
  approveSeller(@Param('id') id: string, @Body() dto: ApproveSellerDto) {
    return this.adminService.approveSeller(id, dto);
  }

  @Patch('sellers/:id/suspend')
  @ApiOperation({ summary: 'Suspend seller' })
  suspendSeller(@Param('id') id: string, @Body() dto: SuspendSellerDto) {
    return this.adminService.suspendSeller(id, dto);
  }

  @Get('orders')
  @ApiOperation({ summary: 'All orders with filters' })
  getOrders(@Query() query: AdminOrdersQueryDto) {
    return this.adminService.getAllOrders(query);
  }

  @Post('orders/:id/refund')
  @ApiOperation({ summary: 'Admin: trigger Razorpay refund' })
  refundOrder(@Param('id') id: string, @Body() dto: AdminRefundDto) {
    return this.adminService.refundOrder(id, dto);
  }

  @Get('delivery-partners')
  @ApiOperation({ summary: 'All delivery partners' })
  getDeliveryPartners(@Query() query: any) {
    return this.adminService.getDeliveryPartners(query);
  }

  @Get('complaints')
  @ApiOperation({ summary: 'Return requests queue' })
  getComplaints(@Query() query: any) {
    return this.adminService.getComplaints(query);
  }

  @Post('notifications/broadcast')
  @ApiOperation({ summary: 'Send city-wide push notification' })
  broadcast(@Body() dto: BroadcastDto) {
    return this.adminService.broadcastNotification(dto);
  }
}
