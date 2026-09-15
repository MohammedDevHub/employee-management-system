const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.message ?? `Request failed (${res.status})`, res.status);
  }

  // Some endpoints (e.g. logout) may return no body.
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
}

export interface LeadSummary {
  id: string;
  name: string;
  phone: string;
  status: string;
  createdAt: string;
  assignedSales: { id: string; fullName: string } | null;
}

export const api = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  me: (token: string) => request<CurrentUser>('/auth/me', {}, token),

  leads: (token: string) => request<LeadSummary[]>('/leads', {}, token),
};

export interface TeamPerformanceRow {
  user: { id: string; fullName: string; email: string } | null;
  metric: 'CONFIRMED_ORDERS' | 'DELIVERED_ORDERS' | 'REVENUE' | 'LEADS_CONVERTED';
  targetValue: number;
  actual: number;
  achievementPercent: number;
  remaining: number;
  status: 'ON_TRACK' | 'AT_RISK' | 'ACHIEVED' | 'MISSED';
  autoScore: number;
  managerRating: number | null;
  combinedRating: number;
  periodStart: string;
  periodEnd: string;
}

export interface MarketingMetrics {
  periodStart: string;
  periodEnd: string;
  adSpend: number;
  leads: number;
  confirmedOrders: number;
  deliveredOrders: number;
  revenue: number;
  cpl: number | null;
  cpa: number | null;
  roas: number | null;
  costPerDeliveredOrder: number | null;
  conversionRate: number | null;
  spendBySource: { source: 'MANUAL' | 'FACEBOOK' | 'GOOGLE'; amount: number }[];
}

export const performanceApi = {
  teamPerformance: (token: string) => request<TeamPerformanceRow[]>('/goals/team', {}, token),
  myProgress: (token: string) => request<TeamPerformanceRow[]>('/goals/me', {}, token),
  marketingMetrics: (token: string) => request<MarketingMetrics>('/marketing/metrics', {}, token),
};
