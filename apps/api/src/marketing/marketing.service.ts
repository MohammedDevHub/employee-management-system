import { Injectable } from '@nestjs/common';
import { AdSpendSource } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdSpendDto } from './dto/create-ad-spend.dto';

export interface MarketingMetrics {
  periodStart: Date;
  periodEnd: Date;
  adSpend: number;
  leads: number;
  confirmedOrders: number;
  deliveredOrders: number;
  revenue: number;
  cpl: number | null;
  cpa: number | null;
  roas: number | null;
  costPerDeliveredOrder: number | null;
  conversionRate: number | null;
  spendBySource: { source: AdSpendSource; amount: number }[];
}

@Injectable()
export class MarketingService {
  constructor(private prisma: PrismaService) {}

  createAdSpend(dto: CreateAdSpendDto) {
    return this.prisma.adSpendEntry.create({
      data: {
        source: dto.source as AdSpendSource,
        amount: dto.amount,
        date: new Date(dto.date),
        campaign: dto.campaign,
      },
    });
  }

  listAdSpend(periodStart: Date, periodEnd: Date) {
    return this.prisma.adSpendEntry.findMany({
      where: { date: { gte: periodStart, lte: periodEnd } },
      orderBy: { date: 'desc' },
    });
  }

  // Every ratio returns null rather than 0 when its denominator is 0 —
  // "no data yet" and "genuinely zero" must not look the same on a dashboard
  // that people make spend decisions from.
  async metrics(periodStart: Date, periodEnd: Date): Promise<MarketingMetrics> {
    const range = { gte: periodStart, lte: periodEnd };

    const spendEntries = await this.prisma.adSpendEntry.findMany({
      where: { date: range },
      select: { source: true, amount: true },
    });

    const adSpend = spendEntries.reduce((sum, e) => sum + Number(e.amount), 0);

    const spendBySourceMap = new Map<AdSpendSource, number>();
    for (const entry of spendEntries) {
      spendBySourceMap.set(entry.source, (spendBySourceMap.get(entry.source) ?? 0) + Number(entry.amount));
    }
    const spendBySource = Array.from(spendBySourceMap, ([source, amount]) => ({ source, amount }));

    const leads = await this.prisma.lead.count({ where: { createdAt: range } });

    const confirmedOrders = await this.prisma.order.count({
      where: { status: 'CONFIRMED', confirmedAt: range },
    });

    const deliveredOrders = await this.prisma.order.count({
      where: { status: 'DELIVERED', deliveredAt: range },
    });

    const revenueAgg = await this.prisma.order.aggregate({
      where: { status: { in: ['CONFIRMED', 'DELIVERED'] }, confirmedAt: range },
      _sum: { value: true },
    });
    const revenue = Number(revenueAgg._sum.value ?? 0);

    const ratio = (numerator: number, denominator: number) =>
      denominator > 0 ? Math.round((numerator / denominator) * 100) / 100 : null;

    return {
      periodStart,
      periodEnd,
      adSpend,
      leads,
      confirmedOrders,
      deliveredOrders,
      revenue,
      cpl: ratio(adSpend, leads),
      cpa: ratio(adSpend, confirmedOrders),
      roas: ratio(revenue, adSpend),
      costPerDeliveredOrder: ratio(adSpend, deliveredOrders),
      conversionRate: leads > 0 ? Math.round((confirmedOrders / leads) * 100 * 100) / 100 : null,
      spendBySource,
    };
  }
}
