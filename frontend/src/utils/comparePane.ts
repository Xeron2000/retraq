import type { Timeframe } from '../services/api';

export type CompareMode = 'off' | 'symbol' | 'timeframe';

export interface ComparePaneRequest {
  mode: CompareMode;
  symbol: string;
  timeframe: Timeframe;
  compareSymbol?: string;
  compareTimeframe?: Timeframe;
}

export interface ComparePaneTarget {
  symbol: string;
  timeframe: Timeframe;
}

export interface CompareAnnotationPolicy {
  markers: boolean;
  priceLines: boolean;
}

export interface ComparePaneContract {
  mode: CompareMode;
  primary: ComparePaneTarget;
  secondary: ComparePaneTarget | null;
  annotations: {
    main: CompareAnnotationPolicy;
    secondary: CompareAnnotationPolicy;
  };
}

export function resolveComparePane(request: ComparePaneRequest): ComparePaneContract {
  const primary = {
    symbol: request.symbol,
    timeframe: request.timeframe,
  };

  const secondary =
    request.mode === 'symbol'
      ? {
          symbol: request.compareSymbol ?? request.symbol,
          timeframe: request.timeframe,
        }
      : request.mode === 'timeframe'
        ? {
            symbol: request.symbol,
            timeframe: request.compareTimeframe ?? request.timeframe,
          }
        : null;

  return {
    mode: request.mode,
    primary,
    secondary,
    annotations: {
      main: { markers: true, priceLines: true },
      secondary: {
        markers: request.mode === 'timeframe',
        priceLines: request.mode === 'timeframe',
      },
    },
  };
}
