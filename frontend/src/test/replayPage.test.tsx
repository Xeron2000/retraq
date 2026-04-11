import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ReplayPage from '../pages/ReplayPage';
import type { ReplaySessionRecord, ReplaySessionSeed } from '../utils/replaySession';
import {
  REPLAY_SESSION_STORAGE_KEY,
  REPLAY_SESSION_VERSION,
  createReplaySeedFromTrade,
  deserializeReplaySession,
  serializeReplaySession,
} from '../utils/replaySession';
import {
  REPLAY_WORKSPACE_STORAGE_KEY,
  createReplayWorkspaceRecord,
  serializeReplayWorkspace,
} from '../utils/replayWorkspace';

const routeSeed: ReplaySessionSeed = {
  tradeId: 11,
  symbol: 'SOL-USDT',
  direction: 'long',
  leverage: 3,
  entryPrice: 101,
  exitPrice: 111,
  profit: 10,
  profitRate: 0.1,
  margin: 100,
  entryTime: 1712800000000,
  exitTime: 1712803600000,
  defaultTimeframe: '1h',
};

const localSeed: ReplaySessionSeed = {
  tradeId: 12,
  symbol: 'ETH-USDT',
  direction: 'short',
  leverage: 5,
  entryPrice: 2000,
  exitPrice: 1950,
  profit: 50,
  profitRate: 0.025,
  margin: 150,
  entryTime: 1712807200000,
  exitTime: 1712810800000,
  defaultTimeframe: '4h',
};

const nextTrade = {
  id: 77,
  symbol: 'DOGE-USDT',
  direction: 'long',
  leverage: 2,
  entry_price: 0.12,
  exit_price: 0.14,
  profit: 20,
  profit_rate: 0.1666666667,
  margin: 40,
  entry_time: 1712814400000,
  exit_time: 1712818000000,
};

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

vi.mock('../components/TradeList', () => ({
  default: ({ selectedTrade, initialSymbol, onSelectTrade }: any) => (
    <div
      data-testid='trade-list'
      data-symbol={selectedTrade?.symbol ?? initialSymbol ?? ''}
      data-trade-id={selectedTrade?.id ?? ''}
    >
      <button type='button' onClick={() => onSelectTrade(nextTrade)}>
        select-next-trade
      </button>
    </div>
  ),
}));

vi.mock('../components/ChartManager', () => ({
  default: ({ symbol, initialTimeframe }: any) => (
    <div
      data-testid='chart-symbol'
      data-symbol={symbol}
      data-initial-timeframe={initialTimeframe ?? ''}
    />
  ),
}));

vi.mock('../components/PositionDetails', () => ({
  default: ({ trade }: any) => <div data-testid='position-symbol' data-symbol={trade?.symbol ?? ''} />,
}));

function renderReplayPage(routeState?: ReplaySessionSeed | null) {
  return render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: '/replay',
          state: routeState ? { seed: routeState } : undefined,
        },
      ]}
    >
      <ReplayPage />
    </MemoryRouter>,
  );
}

function makeRecord(seed: ReplaySessionSeed): ReplaySessionRecord {
  return {
    version: REPLAY_SESSION_VERSION,
    savedAt: 1712821600000,
    seed,
  };
}

function makeWorkspaceRecord(symbol: string) {
  return createReplayWorkspaceRecord(symbol);
}

describe('ReplayPage seed bootstrap', () => {
  beforeEach(() => {
    localStorageStore.clear();
    vi.stubGlobal('localStorage', localStorageMock as Storage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('boots from the route seed before the local replay session', async () => {
    window.localStorage.setItem(REPLAY_SESSION_STORAGE_KEY, serializeReplaySession(makeRecord(localSeed)));
    window.localStorage.setItem(
      REPLAY_WORKSPACE_STORAGE_KEY,
      serializeReplayWorkspace(makeWorkspaceRecord('BTC-USDT')),
    );

    renderReplayPage(routeSeed);

    expect(screen.getByTestId('trade-list')).toHaveAttribute('data-symbol', routeSeed.symbol);
    expect(screen.getByTestId('trade-list')).toHaveAttribute('data-trade-id', String(routeSeed.tradeId));
    expect(screen.getByTestId('chart-symbol')).toHaveAttribute('data-symbol', routeSeed.symbol);
    expect(screen.getByTestId('chart-symbol')).toHaveAttribute('data-initial-timeframe', routeSeed.defaultTimeframe);
    expect(screen.getByTestId('position-symbol')).toHaveAttribute('data-symbol', routeSeed.symbol);

    await waitFor(() => {
      const stored = deserializeReplaySession(window.localStorage.getItem(REPLAY_SESSION_STORAGE_KEY) ?? '');
      expect(stored?.seed).toEqual(routeSeed);
    });
  });

  it('restores the local seed when no route seed exists', async () => {
    window.localStorage.setItem(REPLAY_SESSION_STORAGE_KEY, serializeReplaySession(makeRecord(localSeed)));
    window.localStorage.setItem(
      REPLAY_WORKSPACE_STORAGE_KEY,
      serializeReplayWorkspace(makeWorkspaceRecord('BTC-USDT')),
    );

    renderReplayPage(null);

    expect(screen.getByTestId('trade-list')).toHaveAttribute('data-symbol', localSeed.symbol);
    expect(screen.getByTestId('trade-list')).toHaveAttribute('data-trade-id', String(localSeed.tradeId));
    expect(screen.getByTestId('chart-symbol')).toHaveAttribute('data-symbol', localSeed.symbol);
    expect(screen.getByTestId('chart-symbol')).toHaveAttribute('data-initial-timeframe', localSeed.defaultTimeframe);
    expect(screen.getByTestId('position-symbol')).toHaveAttribute('data-symbol', localSeed.symbol);
  });

  it('boots from the workspace symbol before the latest trade default when no seed exists', () => {
    window.localStorage.setItem(
      REPLAY_WORKSPACE_STORAGE_KEY,
      serializeReplayWorkspace(makeWorkspaceRecord('DOGE-USDT')),
    );

    renderReplayPage(null);

    return waitFor(() => {
      expect(screen.getByTestId('trade-list')).toHaveAttribute('data-symbol', 'DOGE-USDT');
      expect(screen.getByTestId('chart-symbol')).toHaveAttribute('data-symbol', 'DOGE-USDT');
      expect(screen.getByTestId('position-symbol')).toHaveAttribute('data-symbol', '');
    });
  });

  it('lets workspace activeTimeframe override the seed defaultTimeframe', async () => {
    window.localStorage.setItem(
      REPLAY_WORKSPACE_STORAGE_KEY,
      serializeReplayWorkspace({
        ...makeWorkspaceRecord('BTC-USDT'),
        activeTimeframe: '15m',
      }),
    );

    renderReplayPage(routeSeed);

    expect(screen.getByTestId('chart-symbol')).toHaveAttribute('data-initial-timeframe', '15m');

    await waitFor(() => {
      const stored = deserializeReplaySession(window.localStorage.getItem(REPLAY_SESSION_STORAGE_KEY) ?? '');
      expect(stored?.seed.defaultTimeframe).toBe(routeSeed.defaultTimeframe);
    });
  });

  it('persists the selected trade after TradeList hands it off', async () => {
    const user = userEvent.setup();

    renderReplayPage(null);

    await user.click(screen.getByRole('button', { name: 'select-next-trade' }));

    expect(screen.getByTestId('trade-list')).toHaveAttribute('data-symbol', nextTrade.symbol);
    expect(screen.getByTestId('chart-symbol')).toHaveAttribute('data-symbol', nextTrade.symbol);
    expect(screen.getByTestId('position-symbol')).toHaveAttribute('data-symbol', nextTrade.symbol);

    await waitFor(() => {
      const stored = deserializeReplaySession(window.localStorage.getItem(REPLAY_SESSION_STORAGE_KEY) ?? '');
      expect(stored?.seed).toEqual(createReplaySeedFromTrade(nextTrade));
    });
  });
});
