'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';
import { useAuth } from '@/lib/auth-context';
import { performanceApi, TeamPerformanceRow, MarketingMetrics } from '@/lib/api';

const STATUS_COLORS: Record<TeamPerformanceRow['status'], string> = {
  ACHIEVED: '#6FCF97',
  ON_TRACK: '#C9A24D',
  AT_RISK: '#E4C77A',
  MISSED: '#E5636B',
};

const STATUS_LABELS: Record<TeamPerformanceRow['status'], string> = {
  ACHIEVED: 'Achieved',
  ON_TRACK: 'On track',
  AT_RISK: 'At risk',
  MISSED: 'Missed',
};

const METRIC_LABELS: Record<TeamPerformanceRow['metric'], string> = {
  CONFIRMED_ORDERS: 'Confirmed orders',
  DELIVERED_ORDERS: 'Delivered orders',
  REVENUE: 'Revenue (EGP)',
  LEADS_CONVERTED: 'Leads converted',
};

function formatMetric(value: number | null, suffix = '') {
  if (value === null) return 'No data';
  return `${value.toLocaleString()}${suffix}`;
}

export default function PerformancePage() {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<TeamPerformanceRow[] | null>(null);
  const [metrics, setMetrics] = useState<MarketingMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    performanceApi
      .teamPerformance(accessToken)
      .then(setRows)
      .catch(() => setError('Could not load performance data. Is the API running?'));

    // Marketing metrics need marketing.read — a Sales Rep won't have it,
    // so a failure here is expected rather than an error worth showing.
    performanceApi
      .marketingMetrics(accessToken)
      .then(setMetrics)
      .catch(() => setMetrics(null));
  }, [accessToken]);

  if (error) {
    return (
      <div>
        <h1 className="font-display text-2xl text-ink">Performance</h1>
        <p className="mt-6 rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
      </div>
    );
  }

  if (rows === null) {
    return (
      <div>
        <h1 className="font-display text-2xl text-ink">Performance</h1>
        <p className="mt-8 text-sm text-muted">Loading…</p>
      </div>
    );
  }

  const chartData = rows.map((row) => ({
    name: row.user?.fullName?.split(' ')[0] ?? 'Unknown',
    fullName: row.user?.fullName ?? 'Unknown',
    metric: METRIC_LABELS[row.metric],
    done: row.actual,
    remaining: row.remaining,
    achievement: row.achievementPercent,
    status: row.status,
    rating: row.combinedRating,
  }));

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Performance</h1>
      <p className="mt-1 text-sm text-muted">
        Achievement against targets set by management, plus the cost metrics behind them.
      </p>

      {rows.length === 0 && (
        <div className="mt-8 rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-ink">No active targets</p>
          <p className="mt-1 text-sm text-muted">
            Set a target from the Goals API to start tracking achievement here.
          </p>
        </div>
      )}

      {rows.length > 0 && (
        <>
          <section className="mt-8">
            <h2 className="text-sm text-muted">Done vs remaining, per person</h2>
            <div className="mt-4 rounded-lg border border-border bg-surface p-5">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#35225E" horizontal={false} />
                  <XAxis type="number" stroke="#A497C4" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#A497C4" fontSize={12} width={70} />
                  <Tooltip
                    contentStyle={{ background: '#1F1240', border: '1px solid #35225E', borderRadius: 8, color: '#F6F3FB' }}
                    cursor={{ fill: 'rgba(42,24,86,0.4)' }}
                  />
                  <Bar dataKey="done" stackId="a" name="Done" fill="#C9A24D" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="remaining" stackId="a" name="Remaining" fill="#2A1856" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-sm text-muted">Achievement %</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((row, i) => (
                <div key={`${row.user?.id}-${row.metric}-${i}`} className="rounded-lg border border-border bg-surface p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-ink">{row.user?.fullName ?? 'Unknown'}</p>
                      <p className="text-xs text-muted">{METRIC_LABELS[row.metric]}</p>
                    </div>
                    <span
                      className="rounded-full border px-2.5 py-0.5 text-xs"
                      style={{ color: STATUS_COLORS[row.status], borderColor: `${STATUS_COLORS[row.status]}66` }}
                    >
                      {STATUS_LABELS[row.status]}
                    </span>
                  </div>

                  <div className="mt-2 h-[120px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        innerRadius="70%"
                        outerRadius="100%"
                        data={[{ value: Math.min(row.achievementPercent, 100), fill: STATUS_COLORS[row.status] }]}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                        <RadialBar background={{ fill: '#2A1856' }} dataKey="value" cornerRadius={8} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>

                  <p className="text-center font-display text-2xl text-ink">{row.achievementPercent}%</p>
                  <p className="mt-2 text-center text-xs text-muted">
                    {row.actual} of {row.targetValue} · {row.remaining} to go
                  </p>

                  <div className="mt-4 border-t border-border pt-3 text-xs">
                    <div className="flex justify-between text-muted">
                      <span>Auto score</span>
                      <span className="text-ink">{row.autoScore} / 5</span>
                    </div>
                    <div className="mt-1 flex justify-between text-muted">
                      <span>Manager rating</span>
                      <span className="text-ink">{row.managerRating !== null ? `${row.managerRating} / 5` : 'Not reviewed'}</span>
                    </div>
                    <div className="mt-1 flex justify-between text-muted">
                      <span>Combined</span>
                      <span className="text-gold">{row.combinedRating} / 5</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-sm text-muted">Combined rating, per person</h2>
            <div className="mt-4 rounded-lg border border-border bg-surface p-5">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ left: 0, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#35225E" vertical={false} />
                  <XAxis dataKey="name" stroke="#A497C4" fontSize={12} />
                  <YAxis domain={[0, 5]} stroke="#A497C4" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: '#1F1240', border: '1px solid #35225E', borderRadius: 8, color: '#F6F3FB' }}
                    cursor={{ fill: 'rgba(42,24,86,0.4)' }}
                  />
                  <Bar dataKey="rating" name="Rating / 5" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.status as TeamPerformanceRow['status']]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}

      {metrics && (
        <section className="mt-10">
          <h2 className="text-sm text-muted">Cost & return this period</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
            {[
              { label: 'CPL', value: formatMetric(metrics.cpl), hint: 'Ad spend ÷ leads' },
              { label: 'CPA', value: formatMetric(metrics.cpa), hint: 'Ad spend ÷ confirmed orders' },
              { label: 'ROAS', value: metrics.roas === null ? 'No data' : `${metrics.roas}×`, hint: 'Revenue ÷ ad spend' },
              { label: 'Cost per delivered', value: formatMetric(metrics.costPerDeliveredOrder), hint: 'Ad spend ÷ delivered orders' },
              { label: 'Conversion rate', value: metrics.conversionRate === null ? 'No data' : `${metrics.conversionRate}%`, hint: 'Confirmed ÷ leads' },
              { label: 'Ad spend', value: formatMetric(metrics.adSpend), hint: 'Sum of logged spend' },
            ].map((card) => (
              <div key={card.label} className="rounded-lg border border-border bg-surface p-5">
                <p className="text-sm text-muted">{card.label}</p>
                <p className="mt-2 font-display text-2xl text-ink">{card.value}</p>
                <p className="mt-1 text-xs text-muted">{card.hint}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-md border border-border px-4 py-3 text-xs text-muted">
            Spend by source:{' '}
            {metrics.spendBySource.length === 0
              ? 'nothing logged yet'
              : metrics.spendBySource
                  .map((s) => `${s.source} ${s.amount.toLocaleString()}`)
                  .join(' · ')}
            . Anything marked MANUAL was typed in by hand, not synced from an ad platform.
          </div>
        </section>
      )}
    </div>
  );
}
