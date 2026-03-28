import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { CitiesModule } from './cities/cities.module';
import { UsersModule } from './users/users.module';
import { StoresModule } from './stores/stores.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { DeliveryModule } from './delivery/delivery.module';
import { RatingsModule } from './ratings/ratings.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SearchModule } from './search/search.module';
import { AdminModule } from './admin/admin.module';
import { SellerModule } from './seller/seller.module';
import { PaymentsModule } from './payments/payments.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
        },
      }),
    }),
    DatabaseModule,
    AuthModule,
    CitiesModule,
    UsersModule,
    StoresModule,
    CategoriesModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    DeliveryModule,
    RatingsModule,
    NotificationsModule,
    SearchModule,
    AdminModule,
    SellerModule,
    PaymentsModule,
    UploadsModule,
  ],
})
export class AppModule {}
