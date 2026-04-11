import type { Timeframe, Trade } from '../services/api';

export const REPLAY_SESSION_VERSION = 1;
export const REPLAY_SESSION_STORAGE_KEY = 'retraq:replay-session';

export interface ReplaySessionSeed {
  tradeId: number;
  symbol: string;
  direction: string;
  leverage: number;
  entryPrice: number;
  exitPrice: number | null;
  profit: number | null;
  profitRate: number | null;
  margin: number | null;
  entryTime: number;
  exitTime: number | null;
  defaultTimeframe?: Timeframe;
}

export interface ReplaySessionRecord {
  version: typeof REPLAY_SESSION_VERSION;
  savedAt: number;
  seed: ReplaySessionSeed;
}

export interface ReplaySessionResolutionInput {
  routeSeed?: ReplaySessionSeed | null;
  localSession?: ReplaySessionRecord | null;
  latestTrade?: Trade | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const isString = (value: unknown): value is string => typeof value === 'string';

const isReplaySessionSeed = (value: unknown): value is ReplaySessionSeed => {
  if (!isRecord(value)) return false;

  return (
    isNumber(value.tradeId) &&
    isString(value.symbol) &&
    isString(value.direction) &&
    isNumber(value.leverage) &&
    isNumber(value.entryPrice) &&
    (isNumber(value.exitPrice) || value.exitPrice === null) &&
    (isNumber(value.profit) || value.profit === null) &&
    (isNumber(value.profitRate) || value.profitRate === null) &&
    (isNumber(value.margin) || value.margin === null) &&
    isNumber(value.entryTime) &&
    (isNumber(value.exitTime) || value.exitTime === null) &&
    (value.defaultTimeframe === undefined || isString(value.defaultTimeframe))
  );
};

export function createReplaySeedFromTrade(trade: Trade, defaultTimeframe?: Timeframe): ReplaySessionSeed {
  return {
    tradeId: trade.id,
    symbol: trade.symbol,
    direction: trade.direction,
    leverage: trade.leverage,
    entryPrice: trade.entry_price,
    exitPrice: trade.exit_price,
    profit: trade.profit,
    profitRate: trade.profit_rate,
    margin: trade.margin,
    entryTime: trade.entry_time,
    exitTime: trade.exit_time,
    ...(defaultTimeframe ? { defaultTimeframe } : {}),
  };
}

export function resolveReplaySessionSeed(input: ReplaySessionResolutionInput): ReplaySessionSeed | null {
  if (input.routeSeed) return input.routeSeed;
  if (input.localSession) return input.localSession.seed;
  if (input.latestTrade) return createReplaySeedFromTrade(input.latestTrade);
  return null;
}

export function serializeReplaySession(record: ReplaySessionRecord): string {
  return JSON.stringify({
    version: record.version,
    savedAt: record.savedAt,
    seed: record.seed,
  });
}

export function deserializeReplaySession(raw: string): ReplaySessionRecord | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    if (parsed.version !== REPLAY_SESSION_VERSION) return null;
    if (!isNumber(parsed.savedAt)) return null;
    if (!isReplaySessionSeed(parsed.seed)) return null;

    return {
      version: REPLAY_SESSION_VERSION,
      savedAt: parsed.savedAt,
      seed: parsed.seed,
    };
  } catch {
    return null;
  }
}
