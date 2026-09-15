import { PrismaService } from '../../prisma/prisma.service';
import { ScopeType } from '@prisma/client';

/**
 * Turns a resolved data scope into a Prisma `where` clause for any model
 * that has a "who owns this row" field (Lead.assignedSalesId, Order.salesId, ...).
 *
 * OWN / ASSIGNED  -> only rows owned by this user
 * TEAM            -> rows owned by anyone on the same team
 * DEPARTMENT      -> rows owned by anyone in the same department
 * COMPANY         -> no filter, sees everything
 * CAMPAIGN        -> not wired up yet (no campaign model in Phase 1), falls back to OWN
 *
 * @param ownerField the field on the target model that stores the owning user's id,
 *                    e.g. 'assignedSalesId' for Lead, 'salesId' for Order.
 */
export async function buildScopeWhere(
  prisma: PrismaService,
  scope: ScopeType,
  userId: string,
  ownerField: string,
) {
  if (scope === ScopeType.COMPANY) {
    return {};
  }

  if (scope === ScopeType.TEAM || scope === ScopeType.DEPARTMENT) {
    const me = await prisma.user.findUnique({ where: { id: userId } });
    const field = scope === ScopeType.TEAM ? 'teamId' : 'departmentId';
    const value = scope === ScopeType.TEAM ? me?.teamId : me?.departmentId;

    if (!value) {
      // No team/department set on this user yet -> fall back to their own rows only.
      return { [ownerField]: userId };
    }

    const peers = await prisma.user.findMany({
      where: { [field]: value },
      select: { id: true },
    });

    return { [ownerField]: { in: peers.map((p) => p.id) } };
  }

  // OWN, ASSIGNED, CAMPAIGN (placeholder) all resolve to "my own rows" for now.
  return { [ownerField]: userId };
}

// Kept for the leads module's existing call sites.
export async function buildLeadScopeWhere(prisma: PrismaService, scope: ScopeType, userId: string) {
  return buildScopeWhere(prisma, scope, userId, 'assignedSalesId');
}
