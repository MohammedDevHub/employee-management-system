import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MarketingController } from './marketing.controller';
import { MarketingService } from './marketing.service';
import { AdSpendSyncService } from './ad-spend-sync.service';

@Module({
  imports: [AuthModule],
  controllers: [MarketingController],
  providers: [MarketingService, AdSpendSyncService],
})
export class MarketingModule {}
