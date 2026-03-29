import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { SlaEnforcementProcessor } from './orders.processor';
import { SlaScheduler } from './sla.scheduler';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'sla-enforcement',
    }),
    PaymentsModule,
    NotificationsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, SlaEnforcementProcessor, SlaScheduler],
  exports: [OrdersService],
})
export class OrdersModule {}
