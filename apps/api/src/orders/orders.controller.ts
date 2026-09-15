import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ScopeType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('orders.read')
  @Get()
  findAll(@Req() req: { user: { id: string }; dataScope: ScopeType }) {
    return this.ordersService.findAllScoped(req.dataScope, req.user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('orders.write')
  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('orders.write')
  @Patch(':id/confirm')
  confirm(@Param('id') id: string) {
    return this.ordersService.confirm(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('orders.write')
  @Patch(':id/deliver')
  deliver(@Param('id') id: string) {
    return this.ordersService.deliver(id);
  }
}
