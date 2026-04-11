import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ChartManager from '../components/ChartManager';
import type { Trade } from '../services/api';

const compareModeToggleSpy = vi.hoisted(() => ({
  createSeriesMarkersSpy: vi.fn(),
  createPriceLineSpy: vi.fn(() => ({ id: Math.random() })),
  removePriceLineSpy: vi.fn(),
  fetchKlinesCalls: [] as Array<{
    symbol: string;
    timeframe: string;
    range?: { start: number; end: number };
  }>,
  charts: [] as Array<ReturnType<typeof createChartMock>>,
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

const TIMEFRAME_STEPS: Record<'5m' | '15m' | '1h' | '4h' | '1d', number> = {
  '5m': 300,
  '15m': 900,
  '1h': 3_600,
  '4h': 14_400,
  '1d': 86_400,
};

function createTimeScaleMock(baseVisibleRange: { from: number; to: number }) {
  let visibleRange = baseVisibleRange;
  const visibleTimeRangeHandlers = new Set<(range: { from: number; to: number }) => void>();
  const visibleLogicalRangeHandlers = new Set<(range: { from: number; to: number }) => void>();

  return {
    setVisibleRange: vi.fn((range: { from: number; to: number }) => {
      visibleRange = range;
      visibleTimeRangeHandlers.forEach((handler) => {
        handler(range);
      });
    }),
    getVisibleRange: vi.fn(() => visibleRange),
    subscribeVisibleTimeRangeChange: vi.fn((handler: (range: { from: number; to: number }) => void) => {
      visibleTimeRangeHandlers.add(handler);
    }),
    subscribeVisibleLogicalRangeChange: vi.fn((handler: (range: { from: number; to: number }) => void) => {
      visibleLogicalRangeHandlers.add(handler);
    }),
    unsubscribeVisibleTimeRangeChange: vi.fn((handler: (range: { from: number; to: number }) => void) => {
      visibleTimeRangeHandlers.delete(handler);
    }),
    unsubscribeVisibleLogicalRangeChange: vi.fn((handler: (range: { from: number; to: number }) => void) => {
      visibleLogicalRangeHandlers.delete(handler);
    }),
    setVisibleLogicalRange: vi.fn((range: { from: number; to: number }) => {
      visibleRange = range;
      visibleLogicalRangeHandlers.forEach((handler) => {
        handler(range);
      });
    }),
  };
}

function createChartMock(containerLabel: string) {
	const timeScale = createTimeScaleMock({
	  from: Math.floor(selectedTrade.entry_time / 1000) - 3_600,
	  to: Math.floor((selectedTrade.exit_time ?? selectedTrade.entry_time) / 1000) + 3_600,
	});
  const crosshairHandlers = new Set<(param: unknown) => void>();

  const chart = {
    addSeries: vi.fn(() => ({
      setData: vi.fn(),
      createPriceLine: compareModeToggleSpy.createPriceLineSpy,
      removePriceLine: compareModeToggleSpy.removePriceLineSpy,
    })),
    priceScale: vi.fn(() => ({ applyOptions: vi.fn() })),
    timeScale: vi.fn(() => timeScale),
    subscribeCrosshairMove: vi.fn((handler: (param: unknown) => void) => {
      crosshairHandlers.add(handler);
    }),
    unsubscribeCrosshairMove: vi.fn((handler: (param: unknown) => void) => {
      crosshairHandlers.delete(handler);
    }),
    applyOptions: vi.fn(),
    remove: vi.fn(),
    clearCrosshairPosition: vi.fn(),
    setCrosshairPosition: vi.fn(),
    __emitCrosshairMove: (param: unknown) => {
      crosshairHandlers.forEach((handler) => {
        handler(param);
      });
    },
    __containerLabel: containerLabel,
  };

  compareModeToggleSpy.charts.push(chart);
  return chart;
}

vi.mock('../services/api', () => ({
  fetchStats: async () => ({
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
  }),
  fetchKlines: async (
    symbol: string,
    timeframe: keyof typeof TIMEFRAME_STEPS,
    range?: { start: number; end: number },
  ) => {
    compareModeToggleSpy.fetchKlinesCalls.push({ symbol, timeframe, range });

    const base = Math.floor(selectedTrade.entry_time / 1000);
    const step = TIMEFRAME_STEPS[timeframe];

    return Array.from({ length: 12 }, (_, index) => ({
      time: base + index * step,
      open: symbol === 'ETH-USDT' ? 2_000 + index : 100 + index,
      high: symbol === 'ETH-USDT' ? 2_001 + index : 101 + index,
      low: symbol === 'ETH-USDT' ? 1_999 + index : 99 + index,
      close: symbol === 'ETH-USDT' ? 2_000.5 + index : 100.5 + index,
      volume: 10 + index,
    }));
  },
}));

vi.mock('lightweight-charts', () => ({
  CandlestickSeries: Symbol('CandlestickSeries'),
  HistogramSeries: Symbol('HistogramSeries'),
  LineSeries: Symbol('LineSeries'),
  createSeriesMarkers: compareModeToggleSpy.createSeriesMarkersSpy.mockImplementation(() => ({
    setMarkers: vi.fn(),
  })),
  createChart: vi.fn((container: HTMLElement) => createChartMock(container.className)),
}));

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function renderChartManager() {
  return render(<ChartManager symbol='SOL-USDT' selectedTrade={selectedTrade} />);
}

describe('timeframe compare replay shell', () => {
  beforeEach(() => {
    compareModeToggleSpy.createSeriesMarkersSpy.mockClear();
    compareModeToggleSpy.createPriceLineSpy.mockClear();
    compareModeToggleSpy.removePriceLineSpy.mockClear();
    compareModeToggleSpy.fetchKlinesCalls.length = 0;
    compareModeToggleSpy.charts.length = 0;
    localStorageStore.clear();
    vi.stubGlobal('ResizeObserver', ResizeObserverMock as unknown as typeof ResizeObserver);
    vi.stubGlobal('localStorage', localStorageMock as Storage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens same-symbol timeframe compare mode in the replay shell', async () => {
    const user = userEvent.setup();

    renderChartManager();

    expect(screen.getByRole('button', { name: '交易对' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '关闭' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '周期' }));

    expect(await screen.findByText('对比: SOL-USDT')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /对比: BTC-USDT/ })).not.toBeInTheDocument();
    expect(compareModeToggleSpy.fetchKlinesCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ symbol: 'SOL-USDT', timeframe: '4h' }),
      ]),
    );
  });

  it('keeps compare timeframe independent from the main timeframe', async () => {
    const user = userEvent.setup();

    renderChartManager();

    await user.click(screen.getByRole('button', { name: '周期' }));
    await user.click(await screen.findByRole('button', { name: '对比周期 1h' }));

    await waitFor(() => {
      expect(compareModeToggleSpy.fetchKlinesCalls).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ symbol: 'SOL-USDT', timeframe: '1h' }),
        ]),
      );
    });

    await user.click(screen.getByRole('button', { name: '4h' }));

    expect(screen.getByRole('button', { name: '对比周期 1h' })).toHaveAttribute('aria-pressed', 'true');
    expect(compareModeToggleSpy.fetchKlinesCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ symbol: 'SOL-USDT', timeframe: '4h' }),
      ]),
    );
  });

  it('keeps visible range synchronized with the compare chart', async () => {
    const user = userEvent.setup();

    renderChartManager();

    await user.click(screen.getByRole('button', { name: '周期' }));

    await waitFor(() => {
      expect(compareModeToggleSpy.charts).toHaveLength(2);
    });

    const mainChart = compareModeToggleSpy.charts[0];
    const compareChart = compareModeToggleSpy.charts[1];
    compareChart.timeScale().setVisibleRange.mockClear();

    const nextRange = { from: 1_712_800_000, to: 1_712_803_600 };
    mainChart.timeScale().setVisibleRange(nextRange);

    await waitFor(() => {
      expect(compareChart.timeScale().setVisibleRange).toHaveBeenCalledWith(nextRange);
    });
  });

  it('syncs crosshair to the nearest compare bar instead of an exact timestamp', async () => {
    const user = userEvent.setup();

    renderChartManager();

    await user.click(screen.getByRole('button', { name: '周期' }));

    await waitFor(() => {
      expect(compareModeToggleSpy.charts).toHaveLength(2);
    });

    const mainChart = compareModeToggleSpy.charts[0];
    const compareChart = compareModeToggleSpy.charts[1];
    compareChart.setCrosshairPosition.mockClear();

    const sourceTime = Math.floor(selectedTrade.entry_time / 1000) + 900;
    mainChart.__emitCrosshairMove({
      time: sourceTime,
      point: { x: 32, y: 18 },
    });

    await waitFor(() => {
      expect(compareChart.setCrosshairPosition).toHaveBeenCalled();
    });

    const [, targetTime] = compareChart.setCrosshairPosition.mock.calls.at(-1) ?? [];
    expect(targetTime).toBe(Math.floor(selectedTrade.entry_time / 1000));
    expect(targetTime).not.toBe(sourceTime);
  });
});
