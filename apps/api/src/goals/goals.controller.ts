import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ScopeType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { GoalsService } from './goals.service';
import { CreateTargetDto } from './dto/create-target.dto';
import { CreateReviewDto } from './dto/create-review.dto';

@Controller('goals')
export class GoalsController {
  constructor(private goalsService: GoalsService) {}

  // My own target(s) + live achievement — what a Sales Rep sees about themself.
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('goals.read')
  @Get('me')
  myProgress(@Req() req: { user: { id: string } }) {
    return this.goalsService.myProgress(req.user.id);
  }

  // Everyone visible in my scope, with achievement + rating — what a
  // manager/admin sees for their team performance page.
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('goals.read')
  @Get('team')
  teamPerformance(@Req() req: { user: { id: string }; dataScope: ScopeType }) {
    return this.goalsService.teamPerformance(req.dataScope, req.user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('goals.write')
  @Post('targets')
  createTarget(@Body() dto: CreateTargetDto) {
    return this.goalsService.createTarget(dto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('goals.write')
  @Post('reviews')
  createReview(@Body() dto: CreateReviewDto, @Req() req: { user: { id: string } }) {
    return this.goalsService.createReview(dto, req.user.id);
  }
}
