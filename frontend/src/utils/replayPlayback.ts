export const REPLAY_PROGRESS_VERSION = 1;

export type ReplaySpeed = 1 | 2 | 4;

export interface ReplayPlaybackState {
  cursorTime: number | null;
  isPlaying: boolean;
  speed: ReplaySpeed;
}

export interface ReplayProgressRecord {
  version: typeof REPLAY_PROGRESS_VERSION;
  tradeId: number;
  cursorTime: number;
  speed: ReplaySpeed;
  savedAt: number;
}

export type ReplayPlaybackAction =
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'setSpeed'; speed: ReplaySpeed }
  | { type: 'reset'; resetTime: number }
  | { type: 'step' | 'tick'; direction?: 'forward' | 'backward'; stepMs: number; minTime: number; maxTime: number };

interface CreateInitialReplayPlaybackStateInput {
  tradeId: number;
  entryTime: number;
  savedProgress?: ReplayProgressRecord | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const isReplaySpeed = (value: unknown): value is ReplaySpeed => value === 1 || value === 2 || value === 4;

const clampTime = (value: number, minTime: number, maxTime: number) => Math.min(maxTime, Math.max(minTime, value));

export function buildReplayProgressStorageKey(tradeId: number): string {
  return `retraq:replay-progress:${tradeId}`;
}

export function createInitialReplayPlaybackState({
  tradeId,
  entryTime,
  savedProgress,
}: CreateInitialReplayPlaybackStateInput): ReplayPlaybackState {
  if (savedProgress && savedProgress.tradeId === tradeId) {
    return {
      cursorTime: savedProgress.cursorTime,
      isPlaying: false,
      speed: savedProgress.speed,
    };
  }

  return {
    cursorTime: entryTime,
    isPlaying: false,
    speed: 1,
  };
}

export function replayPlaybackReducer(
  state: ReplayPlaybackState,
  action: ReplayPlaybackAction,
): ReplayPlaybackState {
  switch (action.type) {
    case 'play':
      return state.cursorTime == null ? state : { ...state, isPlaying: true };
    case 'pause':
      return { ...state, isPlaying: false };
    case 'setSpeed':
      return { ...state, speed: action.speed };
    case 'reset':
      return {
        ...state,
        cursorTime: action.resetTime,
        isPlaying: false,
      };
    case 'step':
    case 'tick': {
      if (state.cursorTime == null) return state;

      const signedStep = action.direction === 'backward' ? -action.stepMs : action.stepMs;
      const nextCursor = clampTime(state.cursorTime + signedStep, action.minTime, action.maxTime);
      const reachedEnd = nextCursor >= action.maxTime;

      return {
        ...state,
        cursorTime: nextCursor,
        isPlaying: action.type === 'tick' ? !reachedEnd : false,
      };
    }
    default:
      return state;
  }
}

export function createReplayProgressRecord({
  tradeId,
  cursorTime,
  speed,
  savedAt,
}: Omit<ReplayProgressRecord, 'version'>): ReplayProgressRecord {
  return {
    version: REPLAY_PROGRESS_VERSION,
    tradeId,
    cursorTime,
    speed,
    savedAt,
  };
}

export function serializeReplayProgress(record: ReplayProgressRecord): string {
  return JSON.stringify(record);
}

export function deserializeReplayProgress(raw: string): ReplayProgressRecord | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return null;
    if (parsed.version !== REPLAY_PROGRESS_VERSION) return null;
    if (!isFiniteNumber(parsed.tradeId)) return null;
    if (!isFiniteNumber(parsed.cursorTime)) return null;
    if (!isReplaySpeed(parsed.speed)) return null;
    if (!isFiniteNumber(parsed.savedAt)) return null;

    return {
      version: REPLAY_PROGRESS_VERSION,
      tradeId: parsed.tradeId,
      cursorTime: parsed.cursorTime,
      speed: parsed.speed,
      savedAt: parsed.savedAt,
    };
  } catch {
    return null;
  }
}
