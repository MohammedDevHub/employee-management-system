import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ScopeType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { LeadsService } from './leads.service';

@Controller('leads')
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('leads.read')
  @Get()
  findAll(@Req() req: { user: { id: string }; dataScope: ScopeType }) {
    return this.leadsService.findAllScoped(req.dataScope, req.user.id);
  }
}
