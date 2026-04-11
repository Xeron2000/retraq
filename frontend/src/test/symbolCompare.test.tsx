import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ChartManager from '../components/ChartManager';
import type { Trade } from '../services/api';

const { createSeriesMarkersSpy, createPriceLineSpy, removePriceLineSpy, setVisibleRangeSpy } = vi.hoisted(() => ({
  createSeriesMarkersSpy: vi.fn(),
  createPriceLineSpy: vi.fn(() => ({ id: Math.random() })),
  removePriceLineSpy: vi.fn(),
  setVisibleRangeSpy: vi.fn(),
}));

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

const selectedTrade: Trade = {
  id: 91,
  symbol: 'SOL-USDT',
  direction: 'long',
  leverage: 3,
  entry_price: 100,
  exit_price: 110,
  profit: 10,
  profit_rate: 0.1,
  margin: 90,
  entry_time: 1_712_800_000_000,
  exit_time: 1_712_800_900_000,
};

vi.mock('../services/api', () => ({
  fetchStats: vi.fn(async () => ({
    total_pnl: 0,
    win_rate: 0,
    profit_factor: 0,
    max_drawdown: 0,
    avg_holding_time: 0,
    symbol_distribution: {
      'SOL-USDT': 2,
      'ETH-USDT': 2,
    },
    trade_count: 4,
  })),
  fetchKlines: vi.fn(async (symbol: string, timeframe: string) => {
    const base = Math.floor(selectedTrade.entry_time / 1000);
    const step = timeframe === '4h' ? 14_400 : timeframe === '1d' ? 86_400 : timeframe === '1h' ? 3_600 : timeframe === '15m' ? 900 : 300;

    return Array.from({ length: 12 }, (_, index) => ({
      time: base + index * step,
      open: symbol === 'ETH-USDT' ? 2000 + index : 100 + index,
      high: symbol === 'ETH-USDT' ? 2001 + index : 101 + index,
      low: symbol === 'ETH-USDT' ? 1999 + index : 99 + index,
      close: symbol === 'ETH-USDT' ? 2000.5 + index : 100.5 + index,
      volume: 10 + index,
    }));
  }),
}));

vi.mock('lightweight-charts', () => {
  const createSeries = () => ({
    setData: vi.fn(),
    createPriceLine: createPriceLineSpy,
    removePriceLine: removePriceLineSpy,
  });

  const createTimeScale = () => ({
    setVisibleRange: setVisibleRangeSpy,
    getVisibleRange: vi.fn(() => ({ from: Math.floor(selectedTrade.entry_time / 1000), to: Math.floor((selectedTrade.exit_time ?? selectedTrade.entry_time) / 1000) })),
    subscribeVisibleTimeRangeChange: vi.fn(),
    subscribeVisibleLogicalRangeChange: vi.fn(),
    unsubscribeVisibleTimeRangeChange: vi.fn(),
    unsubscribeVisibleLogicalRangeChange: vi.fn(),
    setVisibleLogicalRange: vi.fn(),
  });

  return {
    CandlestickSeries: Symbol('CandlestickSeries'),
    HistogramSeries: Symbol('HistogramSeries'),
    LineSeries: Symbol('LineSeries'),
    createSeriesMarkers: createSeriesMarkersSpy.mockImplementation(() => ({ setMarkers: vi.fn() })),
    createChart: vi.fn(() => ({
      addSeries: vi.fn(() => createSeries()),
      priceScale: vi.fn(() => ({ applyOptions: vi.fn() })),
      timeScale: vi.fn(() => createTimeScale()),
      subscribeCrosshairMove: vi.fn(),
      unsubscribeCrosshairMove: vi.fn(),
      applyOptions: vi.fn(),
      remove: vi.fn(),
      clearCrosshairPosition: vi.fn(),
      setCrosshairPosition: vi.fn(),
    })),
  };
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function renderChartManager() {
  return render(<ChartManager symbol='SOL-USDT' selectedTrade={selectedTrade} />);
}

describe('symbol compare replay shell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('ResizeObserver', ResizeObserverMock as unknown as typeof ResizeObserver);
    localStorageStore.clear();
    vi.stubGlobal('localStorage', localStorageMock as Storage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exposes an explicit symbol compare mode in the replay shell', async () => {
    const user = userEvent.setup();

    renderChartManager();

    expect(screen.getByRole('button', { name: '交易对' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '关闭' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '交易对' }));

    expect(await screen.findByRole('button', { name: /对比: BTC-USDT/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '交易对' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps the compare symbol when switching symbol compare off and back on', async () => {
    const user = userEvent.setup();

    renderChartManager();

    await user.click(screen.getByRole('button', { name: '交易对' }));
    await user.click(await screen.findByRole('button', { name: /对比: BTC-USDT/ }));
    await user.click(screen.getByRole('button', { name: 'ETH-USDT' }));

    await user.click(screen.getByRole('button', { name: '关闭' }));
    await user.click(screen.getByRole('button', { name: '交易对' }));

    expect(await screen.findByRole('button', { name: /对比: ETH-USDT/ })).toBeInTheDocument();
  });

  it('suppresses selected-trade annotations on the compare series in symbol mode', async () => {
    const user = userEvent.setup();

    renderChartManager();

    await user.click(screen.getByRole('button', { name: '交易对' }));

    await waitFor(() => {
      expect(createSeriesMarkersSpy).toHaveBeenCalled();
      expect(createPriceLineSpy).toHaveBeenCalledTimes(2);
    });

    expect(screen.getByRole('button', { name: '交易对' })).toHaveAttribute('aria-pressed', 'true');
    expect(createSeriesMarkersSpy).toHaveBeenCalledTimes(1);
  });
});
