import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { MarketingService } from './marketing.service';
import { AdSpendSyncService } from './ad-spend-sync.service';
import { CreateAdSpendDto } from './dto/create-ad-spend.dto';

function parseRange(from?: string, to?: string) {
  const periodEnd = to ? new Date(to) : new Date();
  const periodStart = from ? new Date(from) : new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 1);
  return { periodStart, periodEnd };
}

@Controller('marketing')
export class MarketingController {
  constructor(
    private marketingService: MarketingService,
    private adSpendSync: AdSpendSyncService,
  ) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('marketing.read')
  @Get('metrics')
  metrics(@Query('from') from?: string, @Query('to') to?: string) {
    const { periodStart, periodEnd } = parseRange(from, to);
    return this.marketingService.metrics(periodStart, periodEnd);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('marketing.read')
  @Get('ad-spend')
  listAdSpend(@Query('from') from?: string, @Query('to') to?: string) {
    const { periodStart, periodEnd } = parseRange(from, to);
    return this.marketingService.listAdSpend(periodStart, periodEnd);
  }

  // Interim path for getting real spend in before the ad-platform
  // credentials exist. Source is recorded on every row.
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('marketing.write')
  @Post('ad-spend')
  createAdSpend(@Body() dto: CreateAdSpendDto) {
    return this.marketingService.createAdSpend(dto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('marketing.write')
  @Post('ad-spend/sync')
  async sync(@Body() body: { date?: string }) {
    const date = body.date ? new Date(body.date) : new Date();
    const facebook = await this.adSpendSync.syncFromFacebook(date).catch((e) => ({ error: e.message }));
    const google = await this.adSpendSync.syncFromGoogle(date).catch((e) => ({ error: e.message }));
    return { facebook, google };
  }
}
