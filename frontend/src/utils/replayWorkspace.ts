import type { Timeframe } from '../services/api';
import type { CompareMode } from './comparePane';

export const REPLAY_WORKSPACE_VERSION = 1;
export const REPLAY_WORKSPACE_STORAGE_KEY = 'retraq:replay-workspace';

const TIMEFRAMES: Timeframe[] = ['5m', '15m', '1h', '4h', '1d'];
const COMPARE_MODES: CompareMode[] = ['off', 'symbol', 'timeframe'];

export interface ReplayWorkspaceRecord {
  version: typeof REPLAY_WORKSPACE_VERSION;
  savedAt: number;
  symbol: string;
  activeTimeframe?: Timeframe;
  compareMode?: CompareMode;
  compareSymbol?: string;
  compareTimeframe?: Timeframe;
  analyticsPanelOpen?: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isString = (value: unknown): value is string => typeof value === 'string';

const isTimeframe = (value: unknown): value is Timeframe =>
  isString(value) && TIMEFRAMES.includes(value as Timeframe);

const isCompareMode = (value: unknown): value is CompareMode =>
  isString(value) && COMPARE_MODES.includes(value as CompareMode);

export function createReplayWorkspaceRecord(
  symbol: string,
  layout: Partial<Omit<ReplayWorkspaceRecord, 'version' | 'savedAt' | 'symbol'>> = {},
): ReplayWorkspaceRecord {
  return {
    version: REPLAY_WORKSPACE_VERSION,
    savedAt: Date.now(),
    symbol,
    activeTimeframe: layout.activeTimeframe,
    compareMode: layout.compareMode,
    compareSymbol: layout.compareSymbol,
    compareTimeframe: layout.compareTimeframe,
    analyticsPanelOpen: layout.analyticsPanelOpen ?? false,
  };
}

export function serializeReplayWorkspace(record: ReplayWorkspaceRecord): string {
  return JSON.stringify(record);
}

export function deserializeReplayWorkspace(raw: string): ReplayWorkspaceRecord | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    if (parsed.version !== REPLAY_WORKSPACE_VERSION) return null;
    if (!isNumber(parsed.savedAt)) return null;
    if (!isString(parsed.symbol)) return null;

    const activeTimeframe = isTimeframe(parsed.activeTimeframe)
      ? parsed.activeTimeframe
      : undefined;
    const compareMode = isCompareMode(parsed.compareMode)
      ? parsed.compareMode
      : undefined;
    const compareSymbol = isString(parsed.compareSymbol)
      ? parsed.compareSymbol
      : undefined;
    const compareTimeframe = isTimeframe(parsed.compareTimeframe)
      ? parsed.compareTimeframe
      : undefined;
    const analyticsPanelOpen =
      typeof parsed.analyticsPanelOpen === 'boolean'
        ? parsed.analyticsPanelOpen
        : undefined;

    return {
      version: REPLAY_WORKSPACE_VERSION,
      savedAt: parsed.savedAt,
      symbol: parsed.symbol,
      activeTimeframe,
      compareMode,
      compareSymbol,
      compareTimeframe,
      analyticsPanelOpen,
    };
  } catch {
    return null;
  }
}

export function loadReplayWorkspace(): ReplayWorkspaceRecord | null {
  if (typeof window === 'undefined') return null;

  return deserializeReplayWorkspace(window.localStorage.getItem(REPLAY_WORKSPACE_STORAGE_KEY) ?? '');
}

export function saveReplayWorkspace(
  symbol: string,
  layout: Partial<Omit<ReplayWorkspaceRecord, 'version' | 'savedAt' | 'symbol'>> = {},
): void {
  if (typeof window === 'undefined') return;

  const existing = loadReplayWorkspace();

  window.localStorage.setItem(
    REPLAY_WORKSPACE_STORAGE_KEY,
    serializeReplayWorkspace(
      createReplayWorkspaceRecord(symbol, {
        activeTimeframe: layout.activeTimeframe ?? existing?.activeTimeframe,
        compareMode: layout.compareMode ?? existing?.compareMode,
        compareSymbol: layout.compareSymbol ?? existing?.compareSymbol,
        compareTimeframe: layout.compareTimeframe ?? existing?.compareTimeframe,
        analyticsPanelOpen:
          layout.analyticsPanelOpen ?? existing?.analyticsPanelOpen ?? false,
      }),
    ),
  );
}
