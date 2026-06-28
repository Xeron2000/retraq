import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, LineSeries, createSeriesMarkers } from 'lightweight-charts';
import { Maximize2, Minimize2 } from 'lucide-react';
import type { CandlestickData, HistogramData, LineData, SeriesMarker, Time } from 'lightweight-charts';
import { useProfile } from '../context/ProfileContext';
import { fetchKlines, fetchStats } from '../services/api';
import type { Kline, StatsOverview, Trade, Timeframe } from '../services/api';

const TIMEFRAMES: Timeframe[] = ['5m', '15m', '1h', '4h', '1d'];
const TIMEFRAME_MS: Record<Timeframe, number> = {
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
};
const TIME_FILLER_BUFFER_BARS = 1200;
const MAX_TIME_FILLER_POINTS = 20000;
const DEFAULT_COMPARE_SYMBOL = 'BTC-USDT';
const TRADE_FETCH_BUFFER_BARS = 2026;
const TRADE_VIEW_BUFFER_BARS = 200;
const UTC8_OFFSET_SEC = 8 * 60 * 60;

function alignTimeSec(timeSec: number, stepSec: number, mode: 'floor' | 'ceil' = 'floor') {
  if (!Number.isFinite(timeSec) || !Number.isFinite(stepSec) || stepSec <= 0) return timeSec;
  if (mode === 'ceil') return Math.ceil(timeSec / stepSec) * stepSec;
  return Math.floor(timeSec / stepSec) * stepSec;
}

function formatUtc8Time(time: Time): string {
  if (typeof time === 'object' && time && 'year' in time) {
    const { year, month, day } = time;
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }
  const seconds = Number(time);
  if (!Number.isFinite(seconds)) return '';
  const date = new Date((seconds + UTC8_OFFSET_SEC) * 1000);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

interface Props {
  symbol: string;
  selectedTrade: Trade | null;
}

export default function ChartManager({ symbol, selectedTrade }: Props) {
  const { activeProfileId } = useProfile();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const compareContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any | null>(null);
  const seriesRef = useRef<any | null>(null);
  const volumeSeriesRef = useRef<any | null>(null);
  const compareChartRef = useRef<any | null>(null);
  const compareSeriesRef = useRef<any | null>(null);
  const compareVolumeSeriesRef = useRef<any | null>(null);
  const markersRef = useRef<any | null>(null);
  const priceLinesRef = useRef<{ entry?: any; exit?: any }>({});
	const latestMainRequestIdRef = useRef(0);
	const latestCompareRequestIdRef = useRef(0);
	const syncingRangeRef = useRef(false);
	const compareEnabledRef = useRef(false);
	const syncingCrosshairRef = useRef(false);
	const crosshairSyncRafRef = useRef<number | null>(null);
	const pendingCrosshairSyncRef = useRef<{ source: 'main' | 'compare'; time: Time | null } | null>(null);
	const chartsPaneRef = useRef<HTMLDivElement | null>(null);
	const sharedTimelineRef = useRef<HTMLDivElement | null>(null);
	const updatingTimeFillerRef = useRef(false);
	const mainAnchorSeriesRef = useRef<any | null>(null);
	const compareAnchorSeriesRef = useRef<any | null>(null);
	const timeFillerSpecRef = useRef<{ start: Time; end: Time; step: number } | null>(null);
	const mainCandlesByTimeRef = useRef<Map<Time, CandlestickData>>(new Map());
	const compareCandlesByTimeRef = useRef<Map<Time, CandlestickData>>(new Map());
	const mainHasDataRef = useRef(false);
	const compareHasDataRef = useRef(false);
	const pendingMainVisibleRangeRef = useRef<any | null>(null);
	const pendingCompareVisibleRangeRef = useRef<any | null>(null);
  const latestActiveTimeframeRef = useRef<Timeframe>('15m');
  const latestCompareSymbolRef = useRef(DEFAULT_COMPARE_SYMBOL);
  const latestRangeForTradeRef = useRef<{ start: number; end: number } | null>(null);
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>('15m');
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [compareSymbol, setCompareSymbol] = useState(DEFAULT_COMPARE_SYMBOL);
  const compareModalRef = useRef<HTMLDialogElement | null>(null);
  const [symbolOptions, setSymbolOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mainKlineLoading, setMainKlineLoading] = useState(false);
  const [mainKlineError, setMainKlineError] = useState<string | null>(null);
  const [mainHasData, setMainHasData] = useState(false);
  const [compareKlineLoading, setCompareKlineLoading] = useState(false);
  const [compareKlineError, setCompareKlineError] = useState<string | null>(null);
  const [compareHasData, setCompareHasData] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (activeProfileId == null) return;
    fetchStats()
      .then((stats: StatsOverview) => {
        const sorted = Object.entries(stats.symbol_distribution)
          .sort(([, a], [, b]) => b - a)
          .map(([sym]) => ({ value: sym, label: sym }));
        const merged = [{ value: DEFAULT_COMPARE_SYMBOL, label: DEFAULT_COMPARE_SYMBOL }, ...sorted]
          .filter((v, i, arr) => arr.findIndex((x) => x.value === v.value) === i);
        setSymbolOptions(merged);
      })
      .catch(() => {
        setSymbolOptions([{ value: DEFAULT_COMPARE_SYMBOL, label: DEFAULT_COMPARE_SYMBOL }]);
      });
  }, [activeProfileId]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const pane = chartsPaneRef.current;
      setIsFullscreen(Boolean(pane && document.fullscreenElement === pane));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    handleFullscreenChange();
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const rangeForTrade = useMemo(() => {
    if (!selectedTrade) return null;
    const tfMs = TIMEFRAME_MS[activeTimeframe];
    const rawStart = Math.max(0, selectedTrade.entry_time - TRADE_FETCH_BUFFER_BARS * tfMs);
    const start = Math.floor(rawStart / tfMs) * tfMs;
    const endBase = selectedTrade.exit_time ?? selectedTrade.entry_time;
    const rawEnd = endBase + TRADE_FETCH_BUFFER_BARS * tfMs;
    const end = Math.ceil(rawEnd / tfMs) * tfMs;
    return { start, end };
  }, [activeTimeframe, selectedTrade]);

  const visibleRangeForTrade = useMemo(() => {
    if (!selectedTrade) return null;
    const tfMs = TIMEFRAME_MS[activeTimeframe];
    const stepSec = Math.floor(tfMs / 1000);
    const rawStartSec = Math.floor(Math.max(0, selectedTrade.entry_time - TRADE_VIEW_BUFFER_BARS * tfMs) / 1000);
    const rangeStartSec = alignTimeSec(rawStartSec, stepSec, 'floor') as Time;
    const endBaseMs = selectedTrade.exit_time ?? selectedTrade.entry_time;
    const rawEndSec = Math.floor((endBaseMs + TRADE_VIEW_BUFFER_BARS * tfMs) / 1000);
    const rangeEndSec = alignTimeSec(rawEndSec, stepSec, 'ceil') as Time;
    return { from: rangeStartSec, to: rangeEndSec };
  }, [activeTimeframe, selectedTrade]);

  const buildTimeFillerData = useCallback((start: number, end: number, step: number): LineData[] => {
    if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(step) || step <= 0) return [];

    const items: LineData[] = [];
    for (let t = start; t <= end; t += step) {
      items.push({ time: t as Time, value: 0 });
      if (items.length >= MAX_TIME_FILLER_POINTS) break;
    }
    return items;
  }, []);

  const applyTimeFiller = useCallback((target: 'main' | 'compare' | 'both' = 'both') => {
    const spec = timeFillerSpecRef.current;
    if (!spec) return;
    if (typeof spec.start !== 'number' || typeof spec.end !== 'number' || typeof spec.step !== 'number') return;

    const data = buildTimeFillerData(spec.start, spec.end, spec.step);
    if (!data.length) return;

    updatingTimeFillerRef.current = true;
    try {
      if (target === 'main' || target === 'both') {
        mainAnchorSeriesRef.current?.setData?.(data);
      }
      if (target === 'compare' || target === 'both') {
        compareAnchorSeriesRef.current?.setData?.(data);
      }
    } finally {
      requestAnimationFrame(() => {
        updatingTimeFillerRef.current = false;
      });
    }
  }, [buildTimeFillerData]);

  const ensureTimeFiller = useCallback(
    (tf: Timeframe, startSec: number, endSec: number) => {
      const step = Math.floor(TIMEFRAME_MS[tf] / 1000);
      if (!Number.isFinite(step) || step <= 0) return;
      if (!Number.isFinite(startSec) || !Number.isFinite(endSec)) return;

      const alignedStart = Math.floor(startSec / step) * step;
      const alignedEnd = Math.ceil(endSec / step) * step;
      const start = Math.max(0, alignedStart - TIME_FILLER_BUFFER_BARS * step);
      const end = alignedEnd + TIME_FILLER_BUFFER_BARS * step;
      if (end <= start) return;

      const prev = timeFillerSpecRef.current;
      if (prev && prev.step === step) {
        const thresholdBars = Math.max(1, Math.floor(TIME_FILLER_BUFFER_BARS / 2));
        const thresholdSec = thresholdBars * step;
        const safeStart = (prev.start as number) + thresholdSec;
        const safeEnd = (prev.end as number) - thresholdSec;
        if (safeStart <= safeEnd && alignedStart >= safeStart && alignedEnd <= safeEnd) return;
      }

      timeFillerSpecRef.current = { start: start as Time, end: end as Time, step };
      applyTimeFiller('both');
    },
    [applyTimeFiller],
  );

  const loadMainData = useCallback(async (tf: Timeframe, sym: string, range?: { start: number; end: number }) => {
    if (!seriesRef.current || !volumeSeriesRef.current) return;
    latestMainRequestIdRef.current += 1;
    const requestId = latestMainRequestIdRef.current;
    setMainKlineLoading(true);
    setMainKlineError(null);
    setMainHasData(false);
    try {
      seriesRef.current.setData([]);
      volumeSeriesRef.current.setData([]);
      mainCandlesByTimeRef.current = new Map();
      mainHasDataRef.current = false;
      const klines: Kline[] = await fetchKlines(sym, tf, range ? { start: range.start, end: range.end } : undefined);
      if (requestId !== latestMainRequestIdRef.current) return;
	      const data: CandlestickData[] = klines.map(k => ({
	        time: k.time as Time,
	        open: k.open,
	        high: k.high,
	        low: k.low,
	        close: k.close,
	      }));
	      const volume: HistogramData[] = klines.map(k => ({
	        time: k.time as Time,
	        value: k.volume,
	        color: k.close >= k.open ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)',
	      }));
	      seriesRef.current.setData(data);
	      volumeSeriesRef.current.setData(volume);
	      mainCandlesByTimeRef.current = new Map(data.map((candle) => [candle.time, candle]));
	      mainHasDataRef.current = data.length > 0;
	      setMainHasData(data.length > 0);
      setMainKlineError(null);

	      const fillerStart = range ? Math.floor(range.start / 1000) : (data[0]?.time as number | undefined);
	      const fillerEnd = range ? Math.floor(range.end / 1000) : (data[data.length - 1]?.time as number | undefined);
	      if (typeof fillerStart === 'number' && typeof fillerEnd === 'number') {
	        ensureTimeFiller(tf, fillerStart, fillerEnd);
	      }

      const pending = pendingMainVisibleRangeRef.current;
      if (pending && chartRef.current) {
        try {
          if (typeof pending.from === 'number' && typeof pending.to === 'number') {
            chartRef.current.timeScale().setVisibleRange(pending);
          } else if (typeof chartRef.current.timeScale().setVisibleLogicalRange === 'function') {
            chartRef.current.timeScale().setVisibleLogicalRange(pending);
          }
          pendingMainVisibleRangeRef.current = null;
        } catch (err) {
          console.error(err);
        }
      }
    } catch (error) {
      console.error(error);
      if (requestId !== latestMainRequestIdRef.current) return;
      seriesRef.current.setData([]);
      volumeSeriesRef.current.setData([]);
      mainCandlesByTimeRef.current = new Map();
      mainHasDataRef.current = false;
      setMainHasData(false);
      setMainKlineError(error instanceof Error ? error.message : String(error));
    } finally {
      if (requestId === latestMainRequestIdRef.current) {
        setMainKlineLoading(false);
      }
    }
  }, []);

  const loadCompareData = useCallback(async (tf: Timeframe, sym: string, range?: { start: number; end: number }) => {
    if (!compareSeriesRef.current || !compareVolumeSeriesRef.current) return;
    latestCompareRequestIdRef.current += 1;
    const requestId = latestCompareRequestIdRef.current;
    setCompareKlineLoading(true);
    setCompareKlineError(null);
    setCompareHasData(false);
    try {
      compareSeriesRef.current.setData([]);
      compareVolumeSeriesRef.current.setData([]);
      compareCandlesByTimeRef.current = new Map();
      compareHasDataRef.current = false;
      const klines: Kline[] = await fetchKlines(sym, tf, range ? { start: range.start, end: range.end } : undefined);
      if (requestId !== latestCompareRequestIdRef.current) return;
	      const data: CandlestickData[] = klines.map(k => ({
	        time: k.time as Time,
	        open: k.open,
	        high: k.high,
	        low: k.low,
	        close: k.close,
	      }));
	      const volume: HistogramData[] = klines.map(k => ({
	        time: k.time as Time,
	        value: k.volume,
	        color: k.close >= k.open ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)',
	      }));
	      compareSeriesRef.current.setData(data);
	      compareVolumeSeriesRef.current.setData(volume);
	      compareCandlesByTimeRef.current = new Map(data.map((candle) => [candle.time, candle]));
	      compareHasDataRef.current = data.length > 0;
	      setCompareHasData(data.length > 0);
	      setCompareKlineError(null);

      const fillerStart = range ? Math.floor(range.start / 1000) : (data[0]?.time as number | undefined);
      const fillerEnd = range ? Math.floor(range.end / 1000) : (data[data.length - 1]?.time as number | undefined);
      if (typeof fillerStart === 'number' && typeof fillerEnd === 'number') {
        ensureTimeFiller(tf, fillerStart, fillerEnd);
      }

      const pending = pendingCompareVisibleRangeRef.current;
      if (pending && compareChartRef.current) {
        try {
          if (typeof pending.from === 'number' && typeof pending.to === 'number') {
            compareChartRef.current.timeScale().setVisibleRange(pending);
          } else if (typeof compareChartRef.current.timeScale().setVisibleLogicalRange === 'function') {
            compareChartRef.current.timeScale().setVisibleLogicalRange(pending);
          }
          pendingCompareVisibleRangeRef.current = null;
        } catch (err) {
          console.error(err);
        }
      }
    } catch (error) {
      console.error(error);
      if (requestId !== latestCompareRequestIdRef.current) return;
      compareSeriesRef.current.setData([]);
      compareVolumeSeriesRef.current.setData([]);
      compareCandlesByTimeRef.current = new Map();
      compareHasDataRef.current = false;
      setCompareHasData(false);
      setCompareKlineError(error instanceof Error ? error.message : String(error));
    } finally {
      if (requestId === latestCompareRequestIdRef.current) {
        setCompareKlineLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    latestActiveTimeframeRef.current = activeTimeframe;
  }, [activeTimeframe]);

  useEffect(() => {
    latestCompareSymbolRef.current = compareSymbol;
    compareHasDataRef.current = false;
  }, [compareSymbol]);

  useEffect(() => {
    latestRangeForTradeRef.current = rangeForTrade;
  }, [rangeForTrade]);

  useEffect(() => {
    if (!rangeForTrade) return;
    ensureTimeFiller(
      activeTimeframe,
      Math.floor(rangeForTrade.start / 1000),
      Math.floor(rangeForTrade.end / 1000),
    );
  }, [activeTimeframe, rangeForTrade, ensureTimeFiller]);

  const hideSharedTimeline = useCallback(() => {
    if (!sharedTimelineRef.current) return;
    sharedTimelineRef.current.style.opacity = '0';
  }, []);

  const toggleFullscreen = useCallback(() => {
    const pane = chartsPaneRef.current;
    if (!pane) return;
    if (document.fullscreenElement === pane) {
      document.exitFullscreen?.();
      return;
    }
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    }
    pane.requestFullscreen?.();
  }, []);

  const cancelPendingCrosshairSync = useCallback(() => {
    if (crosshairSyncRafRef.current == null) return;
    window.cancelAnimationFrame(crosshairSyncRafRef.current);
    crosshairSyncRafRef.current = null;
    pendingCrosshairSyncRef.current = null;
  }, []);

  const scheduleTargetCrosshairSync = useCallback((source: 'main' | 'compare', time: Time | null) => {
    if (!compareEnabledRef.current) return;

    pendingCrosshairSyncRef.current = { source, time };

    if (crosshairSyncRafRef.current != null) return;

    crosshairSyncRafRef.current = window.requestAnimationFrame(() => {
      crosshairSyncRafRef.current = null;

      const pending = pendingCrosshairSyncRef.current;
      pendingCrosshairSyncRef.current = null;
      if (!pending) return;
      if (!compareEnabledRef.current) return;

      const targetChart = pending.source === 'main' ? compareChartRef.current : chartRef.current;
      const targetSeries = pending.source === 'main' ? compareSeriesRef.current : seriesRef.current;

      if (!targetChart || !targetSeries) return;

      syncingCrosshairRef.current = true;
      try {
        if (pending.time == null) {
          targetChart.clearCrosshairPosition?.();
          return;
        }

        const targetCandle =
          pending.source === 'main'
            ? compareCandlesByTimeRef.current.get(pending.time)
            : mainCandlesByTimeRef.current.get(pending.time);

        if (targetCandle && typeof targetCandle.close === 'number' && typeof targetChart.setCrosshairPosition === 'function') {
          targetChart.setCrosshairPosition(targetCandle.close, pending.time, targetSeries);
        } else {
          targetChart.clearCrosshairPosition?.();
        }
      } catch (err) {
        console.error(err);
      } finally {
        syncingCrosshairRef.current = false;
      }
    });
  }, []);

  const updateSharedCrosshair = useCallback((source: 'main' | 'compare', param: any) => {
    if (syncingCrosshairRef.current) return;

    const paneEl = chartsPaneRef.current;
    const lineEl = sharedTimelineRef.current;
    if (!paneEl || !lineEl) return;

    const mainPlotEl = containerRef.current;
    const sourcePlotEl = source === 'main' ? containerRef.current : compareContainerRef.current;
    if (!mainPlotEl || !sourcePlotEl) return;

    const time = param?.time as Time | undefined;
    const point = param?.point as { x: number; y: number } | undefined;

    if (time == null || !point) {
      hideSharedTimeline();

      if (!compareEnabledRef.current) return;
      scheduleTargetCrosshairSync(source, null);
      return;
    }

    const paneRect = paneEl.getBoundingClientRect();
    const sourceRect = sourcePlotEl.getBoundingClientRect();
    const mainRect = mainPlotEl.getBoundingClientRect();
    const comparePlotEl = compareEnabledRef.current ? compareContainerRef.current : null;
    const compareRect = comparePlotEl?.getBoundingClientRect() ?? mainRect;

    const xInPane = sourceRect.left - paneRect.left + point.x;
    const top = Math.max(0, mainRect.top - paneRect.top);
    const bottom = Math.max(0, paneRect.bottom - compareRect.bottom);

    lineEl.style.left = `${Math.round(xInPane)}px`;
    lineEl.style.top = `${Math.round(top)}px`;
    lineEl.style.bottom = `${Math.round(bottom)}px`;
    lineEl.style.opacity = '1';

    if (!compareEnabledRef.current) return;
    scheduleTargetCrosshairSync(source, time);
  }, [hideSharedTimeline, scheduleTargetCrosshairSync]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: { 
        background: { color: 'transparent' }, 
        textColor: '#d1d4dc' 
      },
      grid: { 
        vertLines: { color: 'rgba(255, 255, 255, 0.1)' }, 
        horzLines: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
      crosshair: { mode: 0 },
      timeScale: { timeVisible: true, secondsVisible: false },
      localization: { timeFormatter: formatUtc8Time },
    }) as any;
    chartRef.current = chart;

	    const series = chart.addSeries(CandlestickSeries, {
	      upColor: '#22C55E',
	      downColor: '#EF4444',
	      borderVisible: false,
	      lastValueVisible: false,
	      priceLineVisible: false,
	      wickUpColor: '#22C55E',
	      wickDownColor: '#EF4444',
    });
    seriesRef.current = series;
    chart.priceScale('right').applyOptions({
      scaleMargins: { top: 0.12, bottom: 0.28 },
      minimumWidth: 120,
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.75, bottom: 0 },
      visible: false,
      borderVisible: false,
      ticksVisible: false,
    });
    volumeSeriesRef.current = volumeSeries;

    const anchorSeries = chart.addSeries(LineSeries, {
      priceScaleId: 'anchor',
      color: 'rgba(0,0,0,0)',
      lineWidth: 1,
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    } as any);
    chart.priceScale('anchor').applyOptions({
      visible: false,
      borderVisible: false,
      ticksVisible: false,
      scaleMargins: { top: 0, bottom: 0 },
    });
    mainAnchorSeriesRef.current = anchorSeries;
    applyTimeFiller('main');

    const onMainCrosshairMove = (param: any) => updateSharedCrosshair('main', param);
    chart.subscribeCrosshairMove?.(onMainCrosshairMove);

    const resizeMain = () => {
      if (!containerRef.current) return;
      if (containerRef.current.clientWidth === 0 || containerRef.current.clientHeight === 0) return;
      chart.applyOptions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
    };
    const observer = new ResizeObserver(() => resizeMain());
    observer.observe(containerRef.current);
    requestAnimationFrame(resizeMain);

    return () => {
      observer.disconnect();
      chart.unsubscribeCrosshairMove?.(onMainCrosshairMove);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    compareEnabledRef.current = compareEnabled;
    if (!compareEnabled) {
      hideSharedTimeline();
      cancelPendingCrosshairSync();
    }
  }, [compareEnabled, hideSharedTimeline, cancelPendingCrosshairSync]);

  useEffect(() => {
    return () => cancelPendingCrosshairSync();
  }, [cancelPendingCrosshairSync]);

  useEffect(() => {
    if (!compareEnabled || !compareContainerRef.current) return;
    if (compareChartRef.current) return;

    const chart = createChart(compareContainerRef.current, {
      width: compareContainerRef.current.clientWidth,
      height: compareContainerRef.current.clientHeight,
      layout: {
        background: { color: 'transparent' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.1)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.1)' },
      },
      crosshair: { mode: 0 },
      timeScale: { timeVisible: true, secondsVisible: false },
      localization: { timeFormatter: formatUtc8Time },
      handleScroll: false,
      handleScale: false,
    }) as any;
    compareChartRef.current = chart;

	    const series = chart.addSeries(CandlestickSeries, {
	      upColor: '#22C55E',
	      downColor: '#EF4444',
	      borderVisible: false,
	      lastValueVisible: false,
	      priceLineVisible: false,
	      wickUpColor: '#22C55E',
	      wickDownColor: '#EF4444',
	    });
    compareSeriesRef.current = series;
    chart.priceScale('right').applyOptions({
      scaleMargins: { top: 0.12, bottom: 0.28 },
      minimumWidth: 120,
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.75, bottom: 0 },
      visible: false,
      borderVisible: false,
      ticksVisible: false,
    });
    compareVolumeSeriesRef.current = volumeSeries;

    const anchorSeries = chart.addSeries(LineSeries, {
      priceScaleId: 'anchor',
      color: 'rgba(0,0,0,0)',
      lineWidth: 1,
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    } as any);
    chart.priceScale('anchor').applyOptions({
      visible: false,
      borderVisible: false,
      ticksVisible: false,
      scaleMargins: { top: 0, bottom: 0 },
    });
    compareAnchorSeriesRef.current = anchorSeries;
    applyTimeFiller('compare');

	    const onCompareCrosshairMove = (param: any) => updateSharedCrosshair('compare', param);
    chart.subscribeCrosshairMove?.(onCompareCrosshairMove);

	    const mainChart = chartRef.current;
	    const compare = compareChartRef.current;
	    let rangeSyncQueued = false;
	    let disposed = false;

		    const scheduleSyncFromMain = () => {
		      if (rangeSyncQueued) return;
		      rangeSyncQueued = true;
		      queueMicrotask(() => {
		        rangeSyncQueued = false;
		        if (disposed) return;
		        if (!compareEnabledRef.current) return;
		        const latestMainChart = chartRef.current;
		        const latestCompareChart = compareChartRef.current;
		        if (!latestMainChart || !latestCompareChart) return;

		        const timeRange = latestMainChart.timeScale().getVisibleRange?.();
		        if (!timeRange || timeRange.from == null || timeRange.to == null) return;

		        syncingRangeRef.current = true;
		        try {
		          ensureTimeFiller(latestActiveTimeframeRef.current, timeRange.from as number, timeRange.to as number);
		          try {
		            latestCompareChart.timeScale().setVisibleRange(timeRange);
		            pendingCompareVisibleRangeRef.current = null;
		          } catch (err) {
		            pendingCompareVisibleRangeRef.current = timeRange;
		            console.error(err);
		          }
		        } catch (err) {
		          console.error(err);
		        } finally {
		          requestAnimationFrame(() => {
		            syncingRangeRef.current = false;
		          });
		        }
		      });
		    };

		    const onMainRangeChange = () => {
		      if (syncingRangeRef.current) return;
		      scheduleSyncFromMain();
		    };

	    mainChart?.timeScale().subscribeVisibleTimeRangeChange?.(onMainRangeChange);
	    mainChart?.timeScale().subscribeVisibleLogicalRangeChange?.(onMainRangeChange);

	    loadCompareData(
	      latestActiveTimeframeRef.current,
	      latestCompareSymbolRef.current,
	      latestRangeForTradeRef.current ?? undefined,
	    );
	    const initialRange = visibleRangeForTrade ?? mainChart?.timeScale().getVisibleRange?.() ?? null;
	    if (initialRange && initialRange.from != null && initialRange.to != null) {
	      ensureTimeFiller(latestActiveTimeframeRef.current, initialRange.from as number, initialRange.to as number);
	      pendingCompareVisibleRangeRef.current = initialRange;
	      try {
	        compare?.timeScale().setVisibleRange(initialRange);
	      } catch (err) {
	        console.error(err);
	      }
	    }

    const resizeCompare = () => {
      if (!compareContainerRef.current) return;
      if (compareContainerRef.current.clientWidth === 0 || compareContainerRef.current.clientHeight === 0) return;
      chart.applyOptions({
        width: compareContainerRef.current.clientWidth,
        height: compareContainerRef.current.clientHeight,
      });
    };
    const observer = new ResizeObserver(() => resizeCompare());
    observer.observe(compareContainerRef.current);
    requestAnimationFrame(resizeCompare);

    return () => {
	    disposed = true;
      mainChart?.timeScale().unsubscribeVisibleTimeRangeChange?.(onMainRangeChange);
      mainChart?.timeScale().unsubscribeVisibleLogicalRangeChange?.(onMainRangeChange);
      observer.disconnect();
      chart.unsubscribeCrosshairMove?.(onCompareCrosshairMove);
      compareChartRef.current?.remove();
      compareChartRef.current = null;
      compareSeriesRef.current = null;
      compareVolumeSeriesRef.current = null;
      compareHasDataRef.current = false;
    };
  }, [compareEnabled, loadCompareData, visibleRangeForTrade]);

  useEffect(() => {
    if (!compareEnabled) return;
    if (!mainHasData) return;
    const mainChart = chartRef.current;
    const compareChart = compareChartRef.current;
    if (!mainChart || !compareChart) return;

    const range = mainChart.timeScale().getVisibleRange?.();
    if (!range || range.from == null || range.to == null) return;

    pendingCompareVisibleRangeRef.current = range;
    try {
      compareChart.timeScale().setVisibleRange(range);
    } catch {
      pendingCompareVisibleRangeRef.current = range;
    }
  }, [compareEnabled, mainHasData]);

  useEffect(() => {
    const effectiveSymbol = selectedTrade?.symbol || symbol;
    if (!effectiveSymbol) return;
    mainHasDataRef.current = false;
    loadMainData(activeTimeframe, effectiveSymbol, rangeForTrade ?? undefined);
  }, [symbol, activeTimeframe, loadMainData, rangeForTrade, selectedTrade]);

  useEffect(() => {
    if (!compareEnabled) return;
    if (!compareSymbol) return;
    loadCompareData(activeTimeframe, compareSymbol, rangeForTrade ?? undefined);
  }, [activeTimeframe, compareEnabled, compareSymbol, loadCompareData, rangeForTrade]);

  useEffect(() => {
    if (!selectedTrade || !seriesRef.current) {
      if (markersRef.current) {
        markersRef.current.setMarkers([]);
      }
      if (priceLinesRef.current.entry) {
        seriesRef.current.removePriceLine(priceLinesRef.current.entry);
        priceLinesRef.current.entry = undefined;
      }
      if (priceLinesRef.current.exit) {
        seriesRef.current.removePriceLine(priceLinesRef.current.exit);
        priceLinesRef.current.exit = undefined;
      }
      return;
    }

    const stepSec = Math.floor(TIMEFRAME_MS[activeTimeframe] / 1000);
    const candlesByTime = mainCandlesByTimeRef.current;

    const resolveMarkerTime = (timeMs: number): Time => {
      const rawSec = Math.floor(timeMs / 1000);
      if (!Number.isFinite(rawSec) || !Number.isFinite(stepSec) || stepSec <= 0) return rawSec as Time;

      const floorSec = alignTimeSec(rawSec, stepSec, 'floor');
      const ceilSec = alignTimeSec(rawSec, stepSec, 'ceil');
      const candidates = [
        floorSec,
        rawSec,
        ceilSec,
        floorSec - stepSec,
        floorSec + stepSec,
        ceilSec - stepSec,
        ceilSec + stepSec,
      ];

      for (const t of candidates) {
        if (candlesByTime.has(t as Time)) return t as Time;
      }

      return floorSec as Time;
    };

    const openTime = resolveMarkerTime(selectedTrade.entry_time);
    const closeTime = selectedTrade.exit_time ? resolveMarkerTime(selectedTrade.exit_time) : null;
    const isLong = selectedTrade.direction === 'long';
    const buyColor = '#22C55E';
    const sellColor = '#EF4444';
    const entryIsBuy = isLong;
    const entryColor = entryIsBuy ? buyColor : sellColor;
    const exitColor = entryIsBuy ? sellColor : buyColor;
    const entryLabel = entryIsBuy ? '买入均价' : '卖出均价';
    const exitLabel = entryIsBuy ? '卖出均价' : '买入均价';

    if (priceLinesRef.current.entry) {
      seriesRef.current.removePriceLine(priceLinesRef.current.entry);
      priceLinesRef.current.entry = undefined;
    }
    if (priceLinesRef.current.exit) {
      seriesRef.current.removePriceLine(priceLinesRef.current.exit);
      priceLinesRef.current.exit = undefined;
    }

    const markers: SeriesMarker<Time>[] = [
      {
        time: openTime,
        position: entryIsBuy ? 'belowBar' : 'aboveBar',
        color: entryColor,
        shape: entryIsBuy ? 'arrowUp' : 'arrowDown',
        text: `${entryLabel}: ${selectedTrade.entry_price.toFixed(4)}`,
      },
    ];

    if (closeTime) {
      markers.push({
        time: closeTime,
        position: entryIsBuy ? 'aboveBar' : 'belowBar',
        color: exitColor,
        shape: entryIsBuy ? 'arrowDown' : 'arrowUp',
        text: `${exitLabel}: ${selectedTrade.exit_price?.toFixed(4) ?? '-'}`,
      });
    }

    if (markersRef.current) {
      markersRef.current.setMarkers(markers);
    } else {
      markersRef.current = createSeriesMarkers(seriesRef.current, markers);
    }

    priceLinesRef.current.entry = seriesRef.current.createPriceLine({
      price: selectedTrade.entry_price,
      color: entryColor,
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: entryLabel,
    });

    if (selectedTrade.exit_price != null) {
      priceLinesRef.current.exit = seriesRef.current.createPriceLine({
        price: selectedTrade.exit_price,
        color: exitColor,
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: exitLabel,
      });
    }

	    const targetRange = {
	      from: visibleRangeForTrade?.from ?? openTime,
	      to: visibleRangeForTrade?.to ?? openTime,
	    };
	    if (mainHasDataRef.current) {
	      try {
	        chartRef.current?.timeScale().setVisibleRange(targetRange);
	      } catch (err) {
	        console.error(err);
	      }
	    } else {
	      pendingMainVisibleRangeRef.current = targetRange;
	    }

		    if (compareEnabledRef.current) {
		      pendingCompareVisibleRangeRef.current = targetRange;
		      try {
		        compareChartRef.current?.timeScale().setVisibleRange(targetRange);
		      } catch {
		        pendingCompareVisibleRangeRef.current = targetRange;
		      }
		    }

  }, [activeTimeframe, mainHasData, selectedTrade, visibleRangeForTrade]);

  return (
    <div className="card bg-base-200 rounded-none h-full flex flex-col">
      <div ref={chartsPaneRef} className="flex-grow flex flex-col overflow-hidden p-2 gap-2 relative">
        <div className="bg-base-100 border border-base-300 rounded-box flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-base-300">
            <div className="flex items-center gap-3 min-w-0">
              <div className="text-sm text-base-content/70">
                主图: <span className="font-mono">{selectedTrade?.symbol || symbol}</span>
                {mainKlineLoading && <span className="loading loading-spinner loading-xs ml-2" />}
                {mainKlineError && !mainHasData && (
                  <span className="ml-2 text-xs text-error truncate max-w-[240px]">{mainKlineError}</span>
                )}
              </div>
              <div className="tabs tabs-bordered">
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf}
                    className={`tab tab-sm tab-bordered ${activeTimeframe === tf ? 'tab-active' : ''}`}
                    onClick={() => setActiveTimeframe(tf)}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={toggleFullscreen}
                title={isFullscreen ? '退出全屏' : '全屏查看'}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button type="button" className="btn btn-sm" onClick={() => setCompareEnabled((v) => !v)}>
                {compareEnabled ? '隐藏对比' : '多交易对对比'}
              </button>
            </div>
          </div>
          <div ref={containerRef} className="flex-1 min-h-0" />
        </div>

        {compareEnabled && (
          <div className="bg-base-100 border border-base-300 rounded-box flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-base-300">
              <div className="flex items-center gap-3 min-w-0">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => compareModalRef.current?.showModal()}>
                  对比: <span className="font-mono">{compareSymbol}</span>
                  {compareKlineLoading && <span className="loading loading-spinner loading-xs ml-2" />}
                  {compareKlineError && !compareHasData && (
                    <span className="ml-2 text-xs text-error truncate max-w-[240px]">{compareKlineError}</span>
                  )}
                </button>
                <div className="tabs tabs-bordered">
                  {TIMEFRAMES.map((tf) => (
                    <button
                      key={tf}
                      className={`tab tab-sm tab-bordered ${activeTimeframe === tf ? 'tab-active' : ''}`}
                      onClick={() => setActiveTimeframe(tf)}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button type="button" className="btn btn-sm" onClick={() => setCompareEnabled(false)}>
                  隐藏对比
                </button>
              </div>
            </div>
            <div ref={compareContainerRef} className="flex-1 min-h-0" />
          </div>
        )}

        <div
          ref={sharedTimelineRef}
          className="pointer-events-none absolute w-px bg-base-content/40 opacity-0"
          style={{ left: 0, top: 0, bottom: 0, zIndex: 10 }}
        />
      </div>

      <dialog ref={compareModalRef} className="modal modal-bottom sm:modal-middle">
        <div className="modal-box w-11/12 max-w-xl p-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-2xl">
          <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-base-300 bg-base-200/40">
            <div className="min-w-0">
              <h3 className="font-bold text-lg leading-none">选择对比交易对</h3>
              <div className="text-xs text-base-content/60 mt-1 truncate">对比图将与主图同步时间范围</div>
            </div>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => compareModalRef.current?.close()}>
              关闭
            </button>
          </div>

          <div className="px-5 pt-4 pb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => {
                const base = selectedTrade?.symbol || symbol || DEFAULT_COMPARE_SYMBOL;
                setCompareSymbol(base);
                compareModalRef.current?.close();
              }}
            >
              使用当前仓位交易对
            </button>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => {
                setCompareSymbol(DEFAULT_COMPARE_SYMBOL);
                compareModalRef.current?.close();
              }}
            >
              默认 {DEFAULT_COMPARE_SYMBOL}
            </button>
          </div>

          <div className="px-5 pb-3">
            <label className="input input-bordered flex items-center gap-2 bg-base-200/40 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary/30">
              <input
                className="grow"
                type="search"
                placeholder="搜索交易对..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </label>
          </div>

          <div className="px-2 pb-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-1">
              {(symbolOptions.length ? symbolOptions : [{ value: DEFAULT_COMPARE_SYMBOL, label: DEFAULT_COMPARE_SYMBOL }])
                .filter((opt) => {
                  const q = searchQuery.trim().toLowerCase();
                  if (!q) return true;
                  return opt.label.toLowerCase().includes(q);
                })
                .map((opt) => {
                  const isSelected = opt.value === compareSymbol;

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-base-200/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                        isSelected ? 'bg-primary/10 text-primary' : ''
                      }`}
                      onClick={() => {
                        setCompareSymbol(opt.value);
                        compareModalRef.current?.close();
                      }}
                    >
                      <span className="font-mono truncate">{opt.label}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="submit" className="sr-only" aria-label="close">
            close
          </button>
        </form>
      </dialog>
    </div>
  );
}
