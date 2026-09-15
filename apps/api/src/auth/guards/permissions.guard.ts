import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { ScopeType } from '@prisma/client';

// Broadest-to-narrowest, so when a user has this permission via more than one
// role, we grant them the widest scope they're entitled to.
const SCOPE_PRIORITY: ScopeType[] = [
  ScopeType.COMPANY,
  ScopeType.DEPARTMENT,
  ScopeType.TEAM,
  ScopeType.CAMPAIGN,
  ScopeType.ASSIGNED,
  ScopeType.OWN,
];

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<string>(PERMISSION_KEY, context.getHandler());
    if (!requiredPermission) return true;

    const request = context.switchToHttp().getRequest();
    const userId: string | undefined = request.user?.id;
    if (!userId) throw new ForbiddenException('Not authenticated.');

    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: {
        permission: { key: requiredPermission },
        role: { users: { some: { userId } } },
      },
      select: { scope: true },
    });

    if (rolePermissions.length === 0) {
      throw new ForbiddenException(`Missing permission: ${requiredPermission}`);
    }

    const bestScope = SCOPE_PRIORITY.find((scope) => rolePermissions.some((rp) => rp.scope === scope));

    request.dataScope = bestScope ?? ScopeType.OWN;
    return true;
  }
}
