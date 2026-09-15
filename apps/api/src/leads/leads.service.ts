import { Injectable } from '@nestjs/common';
import { ScopeType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { buildScopeWhere } from '../common/scope/scope-filter.util';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async findAllScoped(scope: ScopeType, userId: string) {
    const where = await buildScopeWhere(this.prisma, scope, userId, 'assignedSalesId');

    return this.prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        phone: true,
        status: true,
        createdAt: true,
        assignedSales: { select: { id: true, fullName: true } },
      },
    });
  }
}
