import { Injectable } from '@nestjs/common';
import { OrderStatus, ScopeType, Target, TargetMetric } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTargetDto } from './dto/create-target.dto';
import { CreateReviewDto } from './dto/create-review.dto';

export interface TargetProgress {
  target: Target;
  actual: number;
  achievementPercent: number;
  remaining: number;
  status: 'ON_TRACK' | 'AT_RISK' | 'ACHIEVED' | 'MISSED';
  autoScore: number; // 1-5, derived from achievementPercent
}

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  createTarget(dto: CreateTargetDto) {
    return this.prisma.target.create({
      data: {
        userId: dto.userId,
        metric: dto.metric as TargetMetric,
        targetValue: dto.targetValue,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
      },
    });
  }

  createReview(dto: CreateReviewDto, reviewedById: string) {
    return this.prisma.performanceReview.create({
      data: {
        userId: dto.userId,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        managerRating: dto.managerRating,
        note: dto.note,
        reviewedById,
      },
    });
  }

  private async actualForTarget(target: Target): Promise<number> {
    const { userId, metric, periodStart, periodEnd } = target;
    if (!userId) return 0; // company-wide targets aren't rolled up in Phase 1 yet

    if (metric === 'CONFIRMED_ORDERS' || metric === 'DELIVERED_ORDERS') {
      const status: OrderStatus = metric === 'DELIVERED_ORDERS' ? 'DELIVERED' : 'CONFIRMED';
      const dateField = metric === 'DELIVERED_ORDERS' ? 'deliveredAt' : 'confirmedAt';
      return this.prisma.order.count({
        where: {
          salesId: userId,
          status,
          [dateField]: { gte: periodStart, lte: periodEnd },
        },
      });
    }

    if (metric === 'REVENUE') {
      const result = await this.prisma.order.aggregate({
        where: {
          salesId: userId,
          status: { in: ['CONFIRMED', 'DELIVERED'] },
          confirmedAt: { gte: periodStart, lte: periodEnd },
        },
        _sum: { value: true },
      });
      return Number(result._sum.value ?? 0);
    }

    // LEADS_CONVERTED
    return this.prisma.lead.count({
      where: {
        assignedSalesId: userId,
        status: 'CONVERTED',
        updatedAt: { gte: periodStart, lte: periodEnd },
      },
    });
  }

  async progressFor(target: Target): Promise<TargetProgress> {
    const actual = await this.actualForTarget(target);
    const achievementPercent = target.targetValue > 0 ? Math.round((actual / target.targetValue) * 100) : 0;
    const remaining = Math.max(target.targetValue - actual, 0);
    const now = new Date();

    let status: TargetProgress['status'];
    if (achievementPercent >= 100) {
      status = 'ACHIEVED';
    } else if (now > target.periodEnd) {
      status = 'MISSED';
    } else {
      const totalMs = target.periodEnd.getTime() - target.periodStart.getTime();
      const elapsedMs = now.getTime() - target.periodStart.getTime();
      const timeElapsedPercent = totalMs > 0 ? (elapsedMs / totalMs) * 100 : 0;
      // Behind pace by more than 15 points -> flagged as at risk.
      status = timeElapsedPercent - achievementPercent > 15 ? 'AT_RISK' : 'ON_TRACK';
    }

    const autoScore = Math.max(1, Math.min(5, Math.round((achievementPercent / 100) * 5 * 10) / 10));

    return { target, actual, achievementPercent, remaining, status, autoScore };
  }

  async myProgress(userId: string) {
    const now = new Date();
    const targets = await this.prisma.target.findMany({
      where: { userId, periodEnd: { gte: now } },
      orderBy: { periodStart: 'desc' },
    });
    return Promise.all(targets.map((t) => this.progressFor(t)));
  }

  private async visibleUserIds(scope: ScopeType, userId: string): Promise<string[] | 'ALL'> {
    if (scope === ScopeType.COMPANY) return 'ALL';

    if (scope === ScopeType.TEAM || scope === ScopeType.DEPARTMENT) {
      const me = await this.prisma.user.findUnique({ where: { id: userId } });
      const field = scope === ScopeType.TEAM ? 'teamId' : 'departmentId';
      const value = scope === ScopeType.TEAM ? me?.teamId : me?.departmentId;
      if (!value) return [userId];
      const peers = await this.prisma.user.findMany({ where: { [field]: value }, select: { id: true } });
      return peers.map((p) => p.id);
    }

    return [userId];
  }

  async teamPerformance(scope: ScopeType, userId: string) {
    const visible = await this.visibleUserIds(scope, userId);
    const now = new Date();

    const targets = await this.prisma.target.findMany({
      where: {
        periodEnd: { gte: now },
        userId: visible === 'ALL' ? { not: null } : { in: visible },
      },
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });

    const rows = await Promise.all(
      targets.map(async (target) => {
        const progress = await this.progressFor(target);

        const latestReview = await this.prisma.performanceReview.findFirst({
          where: { userId: target.userId!, periodStart: target.periodStart, periodEnd: target.periodEnd },
          orderBy: { createdAt: 'desc' },
        });

        const combinedRating = latestReview
          ? Math.round(((progress.autoScore + latestReview.managerRating) / 2) * 10) / 10
          : progress.autoScore;

        return {
          user: target.user,
          metric: target.metric,
          targetValue: target.targetValue,
          actual: progress.actual,
          achievementPercent: progress.achievementPercent,
          remaining: progress.remaining,
          status: progress.status,
          autoScore: progress.autoScore,
          managerRating: latestReview?.managerRating ?? null,
          combinedRating,
          periodStart: target.periodStart,
          periodEnd: target.periodEnd,
        };
      }),
    );

    return rows;
  }
}
