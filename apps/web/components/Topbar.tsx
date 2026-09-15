'use client';

import { useAuth } from '@/lib/auth-context';

export function Topbar() {
  const { user, logout } = useAuth();

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '';

  return (
    <header className="flex h-16 items-center justify-between border-b border-border px-8">
      <div />
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm text-ink">{user?.fullName}</p>
          <p className="text-xs text-muted">{user?.email}</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-xs text-gold">
          {initials}
        </div>
        <button
          onClick={logout}
          className="ml-2 rounded-md border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-gold hover:text-ink"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
