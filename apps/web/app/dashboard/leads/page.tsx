'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api, LeadSummary } from '@/lib/api';

const STATUS_STYLES: Record<string, string> = {
  NEW: 'text-muted border-border',
  CONTACTED: 'text-gold border-gold/40',
  INTERESTED: 'text-gold border-gold/40',
  FOLLOW_UP: 'text-gold border-gold/40',
  BOOKING_REQUESTED: 'text-success border-success/40',
  CONVERTED: 'text-success border-success/40',
  LOST: 'text-danger border-danger/40',
};

export default function LeadsPage() {
  const { accessToken } = useAuth();
  const [leads, setLeads] = useState<LeadSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    api
      .leads(accessToken)
      .then(setLeads)
      .catch(() => setError('Could not load leads. Is the API running?'));
  }, [accessToken]);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Leads</h1>
      <p className="mt-1 text-sm text-muted">
        Showing only what your role can see — Sales Reps see their own, Sales Managers see their team.
      </p>

      {error && (
        <p className="mt-6 rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
      )}

      {!error && leads === null && <p className="mt-8 text-sm text-muted">Loading…</p>}

      {!error && leads?.length === 0 && (
        <div className="mt-8 rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-ink">No leads yet</p>
          <p className="mt-1 text-sm text-muted">New leads assigned to you will show up here.</p>
        </div>
      )}

      {!error && leads && leads.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Assigned to</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-t border-border">
                  <td className="px-4 py-3 text-ink">{lead.name}</td>
                  <td className="px-4 py-3 text-muted">{lead.phone}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs ${
                        STATUS_STYLES[lead.status] ?? 'text-muted border-border'
                      }`}
                    >
                      {lead.status.replaceAll('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{lead.assignedSales?.fullName ?? '—'}</td>
                  <td className="px-4 py-3 text-muted">{new Date(lead.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
