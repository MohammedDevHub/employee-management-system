'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users2,
  UserSquare2,
  Package,
  Truck,
  Megaphone,
  Target,
  BarChart3,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, ready: true },
  { href: '/dashboard/leads', label: 'Leads', icon: Users2, ready: true },
  { href: '/dashboard/performance', label: 'Performance', icon: BarChart3, ready: true },
  { href: '/dashboard/customers', label: 'Customers', icon: UserSquare2, ready: false },
  { href: '/dashboard/orders', label: 'Orders', icon: Package, ready: false },
  { href: '/dashboard/delivery', label: 'Delivery', icon: Truck, ready: false },
  { href: '/dashboard/marketing', label: 'Marketing', icon: Megaphone, ready: false },
  { href: '/dashboard/goals', label: 'Goals', icon: Target, ready: false },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="px-6 py-6">
        <p className="font-display text-xl text-ink">LOFA BEAUTY</p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon, ready }) => {
          const active = pathname === href;

          if (!ready) {
            return (
              <div
                key={href}
                className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-muted/50"
              >
                <span className="flex items-center gap-3">
                  <Icon size={17} strokeWidth={1.75} />
                  {label}
                </span>
                <span className="text-[10px] text-muted/50">soon</span>
              </div>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                active ? 'bg-surface-2 text-ink' : 'text-muted hover:bg-surface-2/60 hover:text-ink'
              }`}
            >
              <Icon size={17} strokeWidth={1.75} className={active ? 'text-gold' : ''} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-6 py-4 text-xs text-muted">Phase 1 · Foundation</div>
    </aside>
  );
}
