import { Module } from '@nestjs/common';
import { SellerController } from './seller.controller';
import { SellerService } from './seller.service';
import { DeliveryModule } from '../delivery/delivery.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [DeliveryModule, NotificationsModule],
  controllers: [SellerController],
  providers: [SellerService],
})
export class SellerModule {}
