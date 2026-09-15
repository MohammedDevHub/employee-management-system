'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api, LeadSummary } from '@/lib/api';

const UPCOMING = [
  { label: 'Orders', phase: 'Phase 3' },
  { label: 'Delivery', phase: 'Phase 4' },
  { label: 'Marketing & Ad Spend', phase: 'Phase 5' },
  { label: 'Goals & Targets', phase: 'Phase 6' },
];

export default function DashboardPage() {
  const { user, accessToken } = useAuth();
  const [leads, setLeads] = useState<LeadSummary[] | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    api.leads(accessToken).then(setLeads).catch(() => setLeads([]));
  }, [accessToken]);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Welcome back, {user?.fullName?.split(' ')[0]}</h1>
      <p className="mt-1 text-sm text-muted">Here's what's live in your console so far.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-5">
          <p className="text-sm text-muted">Leads visible to you</p>
          <p className="mt-2 font-display text-3xl text-ink">{leads === null ? '—' : leads.length}</p>
          <p className="mt-1 text-xs text-muted">Scoped to your role automatically</p>
        </div>

        {UPCOMING.slice(0, 2).map((item) => (
          <div key={item.label} className="rounded-lg border border-dashed border-border p-5">
            <p className="text-sm text-muted">{item.label}</p>
            <p className="mt-2 text-sm text-muted">Not built yet — arrives in {item.phase}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="text-sm text-muted">Still to come</h2>
        <ul className="mt-3 space-y-2">
          {UPCOMING.map((item) => (
            <li
              key={item.label}
              className="flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm"
            >
              <span className="text-ink">{item.label}</span>
              <span className="text-muted">{item.phase}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
