import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LeadsModule } from './leads/leads.module';
import { OrdersModule } from './orders/orders.module';
import { GoalsModule } from './goals/goals.module';
import { MarketingModule } from './marketing/marketing.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, LeadsModule, OrdersModule, GoalsModule, MarketingModule],
})
export class AppModule {}
