import axios from 'axios';
import { ACTIVE_PROFILE_STORAGE_KEY } from '../constants/profileStorage';

axios.interceptors.request.use((config) => {
  const url = config.url ?? '';
  const needsProfile =
    url.includes('/api/trades') || url.includes('/api/stats/overview');
  if (needsProfile) {
    const id = localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY);
    if (id) {
      config.headers = config.headers ?? {};
      config.headers['X-Profile-Id'] = id;
    }
  }
  return config;
});

export interface Kline {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Trade {
  id: number;
  symbol: string;
  direction: string;
  leverage: number;
  entry_price: number;
  exit_price: number | null;
  profit: number | null;
  profit_rate: number | null;
  margin: number | null;
  entry_time: number;
  exit_time: number | null;
}

export type Timeframe = '5m' | '15m' | '1h' | '4h' | '1d';

export interface TradesResponse {
  total: number;
  page: number;
  limit: number;
  data: Trade[];
}

export interface Profile {
  id: number;
  name: string;
  user_id: number | null;
  created_at: string | null;
}

export async function fetchProfiles(): Promise<{ data: Profile[] }> {
  const { data } = await axios.get<{ data: Profile[] }>('/api/profiles');
  return data;
}

export async function createProfile(name: string): Promise<Profile> {
  const { data } = await axios.post<Profile>('/api/profiles', { name });
  return data;
}

export async function updateProfile(id: number, name: string): Promise<Profile> {
  const { data } = await axios.patch<Profile>(`/api/profiles/${id}`, { name });
  return data;
}

export async function deleteProfile(id: number): Promise<void> {
  await axios.delete(`/api/profiles/${id}`);
}

export async function fetchImportTemplates(): Promise<{ id: string; label: string }[]> {
  const { data } = await axios.get<{ templates: { id: string; label: string }[] }>(
    '/api/import/templates',
  );
  return data.templates;
}

export async function fetchKlines(
  symbol: string,
  timeframe: Timeframe,
  options?: { start?: number; end?: number; limit?: number },
): Promise<Kline[]> {
  const url = `/api/klines/${symbol}/${timeframe}`;
  const requestConfig = {
    params: { ...options, nocache: 1, _cb: Date.now() },
    headers: { 'Cache-Control': 'no-cache' },
  } as const;

  const maxAttempts = 4;
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const { data } = await axios.get(url, requestConfig);
      return data.data.map((k: { timestamp: number; open: number; high: number; low: number; close: number; volume: number }) => ({
        time: Math.floor(k.timestamp / 1000),
        open: k.open,
        high: k.high,
        low: k.low,
        close: k.close,
        volume: k.volume,
      }));
    } catch (err) {
      lastError = err;
      const axiosError = err as { response?: { status?: number } };
      const status = axiosError?.response?.status;
      const shouldRetry = status == null || status === 502 || status === 503 || status === 504;
      if (!shouldRetry || attempt === maxAttempts) break;
      await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
    }
  }
  throw lastError;
}

export async function fetchTrades(
  filters?: { symbol?: string; start_date?: number; end_date?: number },
  options?: { limit?: number; maxPages?: number },
): Promise<Trade[]> {
  const limit = options?.limit ?? 500;
  const maxPages = options?.maxPages ?? 1000;

  const allTrades: Trade[] = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const { data } = await axios.get<TradesResponse>('/api/trades', { params: { ...filters, page, limit } });
    allTrades.push(...data.data);
    if (allTrades.length >= data.total || data.data.length === 0) break;
  }

  return allTrades;
}

export async function importTrades(
  file: File,
  template: string = 'langge',
): Promise<{ total: number; success: number; failed: number }> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await axios.post('/api/trades/import', formData, {
    params: { template },
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export interface StatsOverview {
  total_pnl: number;
  win_rate: number;
  profit_factor: number;
  max_drawdown: number;
  avg_holding_time: number;
  symbol_distribution: Record<string, number>;
  trade_count: number;
}

export async function fetchStats(): Promise<StatsOverview> {
  const { data } = await axios.get('/api/stats/overview');
  return data;
}