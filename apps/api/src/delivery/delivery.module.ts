import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';
import { DeliveryProcessor } from './delivery.processor';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'delivery-assignment',
    }),
    NotificationsModule,
  ],
  controllers: [DeliveryController],
  providers: [DeliveryService, DeliveryProcessor],
  exports: [DeliveryService],
})
export class DeliveryModule {}
