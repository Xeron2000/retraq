import { describe, expect, it } from 'vitest';
import { resolveComparePane } from '../utils/comparePane';

describe('resolveComparePane', () => {
  it('disables the secondary pane in off mode', () => {
    expect(
      resolveComparePane({
        mode: 'off',
        symbol: 'SOL-USDT',
        timeframe: '15m',
        compareSymbol: 'ETH-USDT',
        compareTimeframe: '4h',
      }),
    ).toEqual({
      mode: 'off',
      primary: { symbol: 'SOL-USDT', timeframe: '15m' },
      secondary: null,
      annotations: {
        main: { markers: true, priceLines: true },
        secondary: { markers: false, priceLines: false },
      },
    });
  });

  it('resolves same-timeframe multi-symbol compare in symbol mode', () => {
    expect(
      resolveComparePane({
        mode: 'symbol',
        symbol: 'SOL-USDT',
        timeframe: '15m',
        compareSymbol: 'ETH-USDT',
        compareTimeframe: '4h',
      }),
    ).toEqual({
      mode: 'symbol',
      primary: { symbol: 'SOL-USDT', timeframe: '15m' },
      secondary: { symbol: 'ETH-USDT', timeframe: '15m' },
      annotations: {
        main: { markers: true, priceLines: true },
        secondary: { markers: false, priceLines: false },
      },
    });
  });

  it('resolves same-symbol multi-timeframe compare in timeframe mode', () => {
    expect(
      resolveComparePane({
        mode: 'timeframe',
        symbol: 'SOL-USDT',
        timeframe: '15m',
        compareSymbol: 'ETH-USDT',
        compareTimeframe: '4h',
      }),
    ).toEqual({
      mode: 'timeframe',
      primary: { symbol: 'SOL-USDT', timeframe: '15m' },
      secondary: { symbol: 'SOL-USDT', timeframe: '4h' },
      annotations: {
        main: { markers: true, priceLines: true },
        secondary: { markers: true, priceLines: true },
      },
    });
  });
});
