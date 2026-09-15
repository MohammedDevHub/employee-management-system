import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, ScopeType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { buildScopeWhere } from '../common/scope/scope-filter.util';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async findAllScoped(scope: ScopeType, userId: string) {
    const where = await buildScopeWhere(this.prisma, scope, userId, 'salesId');
    return this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { sales: { select: { id: true, fullName: true } } },
    });
  }

  create(dto: CreateOrderDto) {
    return this.prisma.order.create({
      data: {
        leadId: dto.leadId,
        salesId: dto.salesId,
        value: dto.value,
        deliveryFee: dto.deliveryFee ?? 0,
      },
    });
  }

  // "Confirmed" = the sale is agreed with the customer, independent of payment
  // collection — matches the README's Confirmed-Sale decision.
  async confirm(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found.');

    return this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CONFIRMED, confirmedAt: new Date() },
    });
  }

  async deliver(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found.');

    return this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.DELIVERED, deliveredAt: new Date() },
    });
  }
}
