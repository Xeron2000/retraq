import { render, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TradeList from '../components/TradeList';
import type { Trade } from '../services/api';
import { fetchTrades } from '../services/api';
import { REPLAY_WORKSPACE_STORAGE_KEY, deserializeReplayWorkspace } from '../utils/replayWorkspace';

const seedTrade: Trade = {
  id: 41,
  symbol: 'ETH-USDT',
  direction: 'short',
  leverage: 5,
  entry_price: 2000,
  exit_price: 1950,
  profit: 50,
  profit_rate: 0.025,
  margin: 150,
  entry_time: 1712800000000,
  exit_time: 1712803600000,
};

const latestTrade: Trade = {
  id: 42,
  symbol: 'BTC-USDT',
  direction: 'long',
  leverage: 3,
  entry_price: 65000,
  exit_price: 66800,
  profit: 1800,
  profit_rate: 0.0276923077,
  margin: 120,
  entry_time: 1712810000000,
  exit_time: 1712813600000,
};

const mockedFetchTrades = vi.mocked(fetchTrades);

const localStorageStore = new Map<string, string>();

const localStorageMock = {
  getItem: (key: string) => localStorageStore.get(key) ?? null,
  setItem: vi.fn((key: string, value: string) => {
    localStorageStore.set(key, String(value));
  }),
  removeItem: vi.fn((key: string) => {
    localStorageStore.delete(key);
  }),
  clear: vi.fn(() => {
    localStorageStore.clear();
  }),
  key: (index: number) => Array.from(localStorageStore.keys())[index] ?? null,
  get length() {
    return localStorageStore.size;
  },
};

vi.mock('../services/api', () => ({
  fetchStats: vi.fn(async () => ({
    total_pnl: 0,
    win_rate: 0,
    profit_factor: 0,
    max_drawdown: 0,
    avg_holding_time: 0,
    symbol_distribution: {
      'BTC-USDT': 12,
      'ETH-USDT': 3,
    },
    trade_count: 15,
  })),
  fetchTrades: vi.fn(async (filters?: { symbol?: string }) => {
    if (filters?.symbol === 'ETH-USDT') {
      return [seedTrade, { ...seedTrade, id: 40, entry_time: 1712796400000 }];
    }

    return [latestTrade, { ...latestTrade, id: 43, entry_time: 1712806400000 }];
  }),
}));

function renderTradeList(selectedTrade: Trade | null, onSelectTrade = vi.fn(), onSymbolChange = vi.fn()) {
  return render(
    <TradeList
      selectedTrade={selectedTrade}
      initialSymbol=''
      workspaceBootstrap={false}
      onSelectTrade={onSelectTrade}
      onSymbolChange={onSymbolChange}
    />,
  );
}

describe('TradeList seed-aware selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageStore.clear();
    vi.stubGlobal('localStorage', localStorageMock as Storage);
  });

  it('persists an explicit symbol filter to the replay workspace storage', async () => {
    const user = userEvent.setup();
    const onSelectTrade = vi.fn();
    const onSymbolChange = vi.fn();

    renderTradeList(null, onSelectTrade, onSymbolChange);

    await waitFor(() => {
      expect(mockedFetchTrades).toHaveBeenCalled();
    });

    await user.click(screen.getByRole('button', { name: /交易对 BTC-USDT/ }));
    await user.click(screen.getByRole('button', { name: 'ETH-USDT 3' }));

    expect(onSymbolChange).toHaveBeenCalledWith('ETH-USDT');
    expect(deserializeReplayWorkspace(localStorageMock.setItem.mock.calls.at(-1)?.[1] ?? '')).toMatchObject({
      version: 1,
      symbol: 'ETH-USDT',
    });
    expect(localStorageMock.setItem).toHaveBeenCalledWith(REPLAY_WORKSPACE_STORAGE_KEY, expect.any(String));
  });

  it('keeps a provided replay seed from being replaced by the latest trade', async () => {
    const onSelectTrade = vi.fn();

    renderTradeList(seedTrade, onSelectTrade);

    await waitFor(() => {
      expect(mockedFetchTrades).toHaveBeenCalled();
    });

    expect(mockedFetchTrades.mock.calls[0]?.[0]).toEqual({ symbol: seedTrade.symbol });
    expect(onSelectTrade).not.toHaveBeenCalledWith(latestTrade);
  });

  it('still opens the latest trade when no replay seed is provided', async () => {
    const onSelectTrade = vi.fn();

    renderTradeList(null, onSelectTrade);

    await waitFor(() => {
      expect(onSelectTrade).toHaveBeenCalledWith(latestTrade);
    });
  });

  it('keeps a workspace bootstrap from being replaced by the latest trade', async () => {
    const onSelectTrade = vi.fn();

    render(
      <TradeList
        selectedTrade={null}
        initialSymbol='ETH-USDT'
        workspaceBootstrap
        onSelectTrade={onSelectTrade}
        onSymbolChange={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(mockedFetchTrades).toHaveBeenCalled();
    });

    expect(mockedFetchTrades.mock.calls[0]?.[0]).toEqual({ symbol: 'ETH-USDT' });
    expect(onSelectTrade).not.toHaveBeenCalledWith(latestTrade);
  });
});
