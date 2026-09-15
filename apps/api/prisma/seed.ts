import { PrismaClient, ScopeType, LeadStatus, OrderStatus, AdSpendSource, TargetMetric } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const PERMISSION_KEYS = [
  'leads.read',
  'leads.write',
  'users.read',
  'orders.read',
  'orders.write',
  'goals.read',
  'goals.write',
  'marketing.read',
  'marketing.write',
];

// What a Sales Rep gets, and at what scope. Anything not listed here they
// simply don't have — the guard denies it.
const SALES_REP_GRANTS: { key: string; scope: ScopeType }[] = [
  { key: 'leads.read', scope: ScopeType.OWN },
  { key: 'leads.write', scope: ScopeType.OWN },
  { key: 'orders.read', scope: ScopeType.OWN },
  { key: 'orders.write', scope: ScopeType.OWN },
  { key: 'goals.read', scope: ScopeType.OWN },
];

const SALES_MANAGER_GRANTS: { key: string; scope: ScopeType }[] = [
  { key: 'leads.read', scope: ScopeType.TEAM },
  { key: 'leads.write', scope: ScopeType.TEAM },
  { key: 'orders.read', scope: ScopeType.TEAM },
  { key: 'orders.write', scope: ScopeType.TEAM },
  { key: 'goals.read', scope: ScopeType.TEAM },
  { key: 'goals.write', scope: ScopeType.TEAM },
  { key: 'marketing.read', scope: ScopeType.COMPANY },
];

async function main() {
  const permissions = await Promise.all(
    PERMISSION_KEYS.map((key) =>
      prisma.permission.upsert({ where: { key }, update: {}, create: { key } }),
    ),
  );
  const permByKey = new Map(permissions.map((p) => [p.key, p]));

  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: { name: 'SUPER_ADMIN', description: 'Full access, COMPANY scope on every permission.' },
  });

  const salesManagerRole = await prisma.role.upsert({
    where: { name: 'SALES_MANAGER' },
    update: {},
    create: { name: 'SALES_MANAGER', description: 'Sees and sets goals for their whole team.' },
  });

  const salesRepRole = await prisma.role.upsert({
    where: { name: 'SALES_REP' },
    update: {},
    create: { name: 'SALES_REP', description: 'Sees only their own leads, orders and goals.' },
  });

  // Super Admin: everything, COMPANY scope.
  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: permission.id } },
      update: { scope: ScopeType.COMPANY },
      create: { roleId: superAdminRole.id, permissionId: permission.id, scope: ScopeType.COMPANY },
    });
  }

  for (const grant of SALES_MANAGER_GRANTS) {
    const permission = permByKey.get(grant.key)!;
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: salesManagerRole.id, permissionId: permission.id } },
      update: { scope: grant.scope },
      create: { roleId: salesManagerRole.id, permissionId: permission.id, scope: grant.scope },
    });
  }

  for (const grant of SALES_REP_GRANTS) {
    const permission = permByKey.get(grant.key)!;
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: salesRepRole.id, permissionId: permission.id } },
      update: { scope: grant.scope },
      create: { roleId: salesRepRole.id, permissionId: permission.id, scope: grant.scope },
    });
  }

  const TEAM_ID = 'team-sales-cairo';
  const passwordHash = await bcrypt.hash('ChangeMe123!', 10);
  const salesPasswordHash = await bcrypt.hash('Sales123!', 10);

  async function ensureUser(
    email: string,
    fullName: string,
    hash: string,
    roleId: string,
    teamId?: string,
  ) {
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, passwordHash: hash, fullName, teamId },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId } },
      update: {},
      create: { userId: user.id, roleId },
    });
    return user;
  }

  const admin = await ensureUser('admin@lofabeauty.com', 'Super Admin', passwordHash, superAdminRole.id);
  const manager = await ensureUser('manager@lofabeauty.com', 'Nour Hassan', salesPasswordHash, salesManagerRole.id, TEAM_ID);
  const sales1 = await ensureUser('sales1@lofabeauty.com', 'Aya Mostafa', salesPasswordHash, salesRepRole.id, TEAM_ID);
  const sales2 = await ensureUser('sales2@lofabeauty.com', 'Omar Nabil', salesPasswordHash, salesRepRole.id, TEAM_ID);

  // ---- Demo data so the charts have something to draw on first run ----
  const existingLeads = await prisma.lead.count();
  if (existingLeads === 0) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const leadSpecs = [
      { name: 'Mona Adel', phone: '01012345678', status: LeadStatus.CONVERTED, salesId: sales1.id, order: { value: 1800, delivered: true } },
      { name: 'Youssef Tarek', phone: '01123456789', status: LeadStatus.CONTACTED, salesId: sales1.id, order: null },
      { name: 'Farida Samir', phone: '01234567890', status: LeadStatus.CONVERTED, salesId: sales1.id, order: { value: 2400, delivered: true } },
      { name: 'Nada Hesham', phone: '01555112233', status: LeadStatus.CONVERTED, salesId: sales1.id, order: { value: 1500, delivered: false } },
      { name: 'Hana Kamal', phone: '01098765432', status: LeadStatus.CONVERTED, salesId: sales2.id, order: { value: 3200, delivered: true } },
      { name: 'Salma Gamal', phone: '01187654321', status: LeadStatus.LOST, salesId: sales2.id, order: null },
      { name: 'Rana Fouad', phone: '01277889900', status: LeadStatus.FOLLOW_UP, salesId: sales2.id, order: null },
    ];

    for (const spec of leadSpecs) {
      const lead = await prisma.lead.create({
        data: {
          name: spec.name,
          phone: spec.phone,
          status: spec.status,
          assignedSalesId: spec.salesId,
          createdById: admin.id,
          createdAt: monthStart,
        },
      });

      if (spec.order) {
        await prisma.order.create({
          data: {
            leadId: lead.id,
            salesId: spec.salesId,
            status: spec.order.delivered ? OrderStatus.DELIVERED : OrderStatus.CONFIRMED,
            value: spec.order.value,
            deliveryFee: 50,
            confirmedAt: monthStart,
            deliveredAt: spec.order.delivered ? monthStart : null,
          },
        });
      }
    }

    // Marked MANUAL, not FACEBOOK/GOOGLE — these are demo numbers, and the
    // source field exists precisely so nobody mistakes them for synced data.
    await prisma.adSpendEntry.createMany({
      data: [
        { source: AdSpendSource.MANUAL, amount: 4000, date: monthStart, campaign: 'Demo seed — replace with synced data' },
        { source: AdSpendSource.MANUAL, amount: 2500, date: monthStart, campaign: 'Demo seed — replace with synced data' },
      ],
    });

    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    await prisma.target.createMany({
      data: [
        { userId: sales1.id, metric: TargetMetric.CONFIRMED_ORDERS, targetValue: 5, periodStart: monthStart, periodEnd: monthEnd },
        { userId: sales2.id, metric: TargetMetric.CONFIRMED_ORDERS, targetValue: 4, periodStart: monthStart, periodEnd: monthEnd },
        { userId: sales1.id, metric: TargetMetric.REVENUE, targetValue: 8000, periodStart: monthStart, periodEnd: monthEnd },
      ],
    });

    await prisma.performanceReview.create({
      data: {
        userId: sales1.id,
        periodStart: monthStart,
        periodEnd: monthEnd,
        managerRating: 4,
        note: 'Strong follow-up discipline this period.',
        reviewedById: manager.id,
      },
    });
  }

  console.log('Seed complete. Accounts:');
  console.log('  admin@lofabeauty.com   / ChangeMe123!  (SUPER_ADMIN, COMPANY scope)');
  console.log('  manager@lofabeauty.com / Sales123!     (SALES_MANAGER, TEAM scope)');
  console.log('  sales1@lofabeauty.com  / Sales123!     (SALES_REP, OWN scope)');
  console.log('  sales2@lofabeauty.com  / Sales123!     (SALES_REP, OWN scope)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
