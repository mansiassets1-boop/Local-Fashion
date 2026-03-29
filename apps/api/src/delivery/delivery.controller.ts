import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import {
  UpdateLocationDto, ToggleAvailabilityDto, VerifyDeliveryOtpDto, EarningsQueryDto,
} from './dto/delivery.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Delivery')
@Controller('delivery')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('delivery')
@ApiBearerAuth()
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Patch('availability')
  @ApiOperation({ summary: 'Toggle online/offline status' })
  toggleAvailability(
    @CurrentUser('id') userId: string,
    @Body() dto: ToggleAvailabilityDto,
  ) {
    return this.deliveryService.toggleAvailability(userId, dto);
  }

  @Post('location')
  @ApiOperation({ summary: 'Store GPS coordinates' })
  updateLocation(@CurrentUser('id') userId: string, @Body() dto: UpdateLocationDto) {
    return this.deliveryService.updateLocation(userId, dto);
  }

  @Patch('assignments/:id/accept')
  @ApiOperation({ summary: 'Accept delivery assignment (60s window)' })
  acceptAssignment(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.deliveryService.acceptAssignment(id, userId);
  }

  @Patch('assignments/:id/reject')
  @ApiOperation({ summary: 'Reject delivery assignment' })
  rejectAssignment(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.deliveryService.rejectAssignment(id, userId);
  }

  @Post('otp-verify')
  @ApiOperation({ summary: 'Verify delivery OTP to mark as delivered' })
  verifyOtp(@CurrentUser('id') userId: string, @Body() dto: VerifyDeliveryOtpDto) {
    return this.deliveryService.verifyDeliveryOtp(userId, dto);
  }

  @Get('earnings')
  @ApiOperation({ summary: 'Earnings summary by period' })
  getEarnings(@CurrentUser('id') userId: string, @Query() query: EarningsQueryDto) {
    return this.deliveryService.getEarnings(userId, query.period);
  }
}
