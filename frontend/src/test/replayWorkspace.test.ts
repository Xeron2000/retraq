import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  REPLAY_WORKSPACE_STORAGE_KEY,
  REPLAY_WORKSPACE_VERSION,
  deserializeReplayWorkspace,
  loadReplayWorkspace,
  saveReplayWorkspace,
  serializeReplayWorkspace,
  type ReplayWorkspaceRecord,
} from '../utils/replayWorkspace';

const localStorageStore = new Map<string, string>();

const localStorageMock = {
  getItem: (key: string) => localStorageStore.get(key) ?? null,
  setItem: (key: string, value: string) => {
    localStorageStore.set(key, String(value));
  },
  removeItem: (key: string) => {
    localStorageStore.delete(key);
  },
  clear: () => {
    localStorageStore.clear();
  },
  key: (index: number) => Array.from(localStorageStore.keys())[index] ?? null,
  get length() {
    return localStorageStore.size;
  },
};

const makeRecord = (symbol: string): ReplayWorkspaceRecord => ({
  version: REPLAY_WORKSPACE_VERSION,
  savedAt: 1712821600000,
  symbol,
});

describe('replayWorkspace transport', () => {
  beforeEach(() => {
    localStorageStore.clear();
    vi.stubGlobal('localStorage', localStorageMock as Storage);
  });

  it('round-trips a versioned workspace record', () => {
    const record = makeRecord('ETH-USDT');

    expect(serializeReplayWorkspace(record)).toBe(JSON.stringify(record));
    expect(deserializeReplayWorkspace(JSON.stringify(record))).toEqual(record);
  });

  it('rejects stale workspace blobs', () => {
    const staleBlob = JSON.stringify({
      version: REPLAY_WORKSPACE_VERSION - 1,
      savedAt: 1712821600000,
      symbol: 'BTC-USDT',
    });

    expect(deserializeReplayWorkspace(staleBlob)).toBeNull();
  });

  it('saves and loads the last replay symbol filter', () => {
    saveReplayWorkspace('DOGE-USDT');

    expect(deserializeReplayWorkspace(window.localStorage.getItem(REPLAY_WORKSPACE_STORAGE_KEY) ?? ''))
      .toMatchObject({
        version: REPLAY_WORKSPACE_VERSION,
        symbol: 'DOGE-USDT',
      });
    expect(loadReplayWorkspace()).toMatchObject({
      version: REPLAY_WORKSPACE_VERSION,
      symbol: 'DOGE-USDT',
    });
  });
});
