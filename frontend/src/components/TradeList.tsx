import { useMemo, useRef, useState, useEffect } from 'react';
import { fetchStats, fetchTrades } from '../services/api';
import type { StatsOverview, Trade } from '../services/api';
import { Search, TrendingUp, TrendingDown, Filter, ChevronDown } from 'lucide-react';
import { saveReplayWorkspace } from '../utils/replayWorkspace';

const ALL_SYMBOLS_LABEL = '全部交易对';
const LOADING_SKELETON_ROWS = ['skeleton-1', 'skeleton-2', 'skeleton-3', 'skeleton-4', 'skeleton-5', 'skeleton-6', 'skeleton-7', 'skeleton-8'] as const;

interface Props {
  selectedTrade?: Trade | null;
  initialSymbol: string;
  workspaceBootstrap: boolean;
  onSelectTrade: (trade: Trade | null) => void;
  onSymbolChange: (symbol: string) => void;
}

export default function TradeList({
  selectedTrade = null,
  initialSymbol,
  workspaceBootstrap,
  onSelectTrade,
  onSymbolChange,
}: Props) {
  const selectedTradeId = selectedTrade?.id ?? null;
  const selectedTradeSymbol = selectedTrade?.symbol ?? '';
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>(selectedTradeSymbol || initialSymbol);
  const [selectedId, setSelectedId] = useState<number | null>(selectedTradeId);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [symbolOptions, setSymbolOptions] = useState<Array<{ value: string; label: string; count: number }>>([
    { value: '', label: ALL_SYMBOLS_LABEL, count: 0 },
  ]);
  const modalRef = useRef<HTMLDialogElement | null>(null);
  const latestTradesRequestIdRef = useRef(0);
  const autoSelectNextFetchRef = useRef(false);
  const hasInitialSelectedTradeRef = useRef(Boolean(selectedTrade));
  const hasWorkspaceBootstrapRef = useRef(workspaceBootstrap && !selectedTrade);
  const selectedTradeRef = useRef(selectedTrade);

  useEffect(() => {
    selectedTradeRef.current = selectedTrade;
  }, [selectedTrade]);

  useEffect(() => {
    if (selectedTradeId === null) return;

    setSelectedSymbol(selectedTradeSymbol);
    setSelectedId(selectedTradeId);
    autoSelectNextFetchRef.current = false;
  }, [selectedTradeId, selectedTradeSymbol]);

  const selectedSymbolMeta = useMemo(() => {
    const selected = symbolOptions.find((opt) => opt.value === selectedSymbol);
    if (selected) return selected;
    return selectedSymbol
      ? { value: selectedSymbol, label: selectedSymbol, count: 0 }
      : { value: '', label: ALL_SYMBOLS_LABEL, count: 0 };
  }, [selectedSymbol, symbolOptions]);

  useEffect(() => {
    fetchStats()
      .then((stats: StatsOverview) => {
        const sortedSymbols = Object.entries(stats.symbol_distribution)
          .sort(([, a], [, b]) => b - a)
          .map(([sym, count]) => ({ value: sym, label: sym, count }));

        const options = [{ value: '', label: ALL_SYMBOLS_LABEL, count: stats.trade_count }, ...sortedSymbols];
        setSymbolOptions(options);

        if (hasInitialSelectedTradeRef.current || hasWorkspaceBootstrapRef.current) {
          return;
        }

        // 优先选择 BTC 相关的交易对，否则选择交易数量最多的
        const btcSymbol = sortedSymbols.find((s) => s.value.toUpperCase().includes('BTC'));
        const defaultSymbol = btcSymbol || sortedSymbols[0];

        if (defaultSymbol) {
          autoSelectNextFetchRef.current = true;
          setSelectedSymbol(defaultSymbol.value);
          onSymbolChange(defaultSymbol.value);
        }
      })
      .catch((err) => {
        console.error(err);
        setSymbolOptions([{ value: '', label: ALL_SYMBOLS_LABEL, count: 0 }]);
      });
  }, [onSymbolChange]);

  useEffect(() => {
    setLoading(true);
    latestTradesRequestIdRef.current += 1;
    const requestId = latestTradesRequestIdRef.current;

    const maxPages = selectedSymbol ? undefined : 1;
    const limit = selectedSymbol ? undefined : 500;
    fetchTrades(selectedSymbol ? { symbol: selectedSymbol } : undefined, { maxPages, limit })
      .then((data) => {
        if (requestId !== latestTradesRequestIdRef.current) return;
        setTrades(data);

        if (selectedTradeRef.current) {
          return;
        }

        if (autoSelectNextFetchRef.current) {
          autoSelectNextFetchRef.current = false;
          const latestTrade = data.reduce<Trade | null>((latest, trade) => {
            if (!latest) return trade;
            return trade.entry_time > latest.entry_time ? trade : latest;
          }, null);
          if (latestTrade) {
            setSelectedId(latestTrade.id);
            onSelectTrade(latestTrade);
          }
        }
      })
      .catch(console.error)
      .finally(() => {
        if (requestId !== latestTradesRequestIdRef.current) return;
        setLoading(false);
      });
  }, [onSelectTrade, selectedSymbol]);

  const filteredSymbolOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return symbolOptions;
    return symbolOptions.filter((opt) => opt.value === '' || opt.label.toLowerCase().includes(q));
  }, [searchQuery, symbolOptions]);

  const openModal = () => {
    setSearchQuery('');
    if (typeof modalRef.current?.showModal === 'function') {
      modalRef.current.showModal();
      return;
    }

    modalRef.current?.setAttribute('open', '');
  };

  const closeModal = () => {
    if (typeof modalRef.current?.close === 'function') {
      modalRef.current.close();
      return;
    }

    modalRef.current?.removeAttribute('open');
  };

  const handleSymbolChange = (symbol: string) => {
    setSelectedId(null);
    onSelectTrade(null);
    autoSelectNextFetchRef.current = true;
    setSelectedSymbol(symbol);
    saveReplayWorkspace(symbol);
    onSymbolChange(symbol);
    closeModal();
  };

  const handleRowClick = (trade: Trade) => {
    setSelectedId(trade.id);
    onSelectTrade(trade);
    if (selectedSymbol !== trade.symbol) {
      setSelectedSymbol(trade.symbol);
    }
    saveReplayWorkspace(trade.symbol);
  };

  return (
    <div className="card bg-base-200 rounded-none h-full">
      <div className="card-body p-0">
        <div className="p-4 border-b border-base-300 sticky top-0 z-10 bg-base-200/80 backdrop-blur supports-[backdrop-filter]:bg-base-200/60">
          <button
            type="button"
            className="group flex w-full items-center justify-between gap-3 rounded-xl border border-base-300 bg-base-100/40 px-3 py-2 text-left text-sm shadow-sm hover:bg-base-100/70 hover:border-base-300/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.99]"
            onClick={openModal}
          >
            <span className="flex items-center gap-3 min-w-0">
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-base-300/60 bg-base-200/40 group-hover:bg-base-200/70">
                <Filter className="h-4 w-4 opacity-80" />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] leading-none text-base-content/60">交易对</span>
                <span className="block truncate font-mono leading-tight mt-1">{selectedSymbolMeta.label}</span>
              </span>
              <span className="badge badge-neutral badge-sm">{selectedSymbolMeta.count}</span>
            </span>
            <ChevronDown className="h-4 w-4 opacity-60" />
          </button>

          <dialog ref={modalRef} className="modal modal-bottom sm:modal-middle">
            <div className="modal-box w-11/12 max-w-xl p-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-2xl">
              <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-base-300 bg-base-200/40">
                <div className="min-w-0">
                  <h3 className="font-bold text-lg leading-none">筛选交易对</h3>
                  <div className="text-xs text-base-content/60 mt-1 truncate">选择交易对后将自动打开最近一笔交易</div>
                </div>
                <button type="button" className="btn btn-sm btn-ghost" onClick={closeModal}>
                  关闭
                </button>
              </div>

              <div className="px-5 pt-4 pb-3">
                <label className="input input-bordered flex items-center gap-2 bg-base-200/40 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary/30">
                  <Search className="h-4 w-4 opacity-70" />
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
                  {filteredSymbolOptions.map((opt) => {
                    const isSelected = (opt.value === '' && selectedSymbol === '') || opt.value === selectedSymbol;

                    return (
                      <button
                        key={opt.value || '__ALL__'}
                        type="button"
                        className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-base-200/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                          isSelected ? 'bg-primary/10 text-primary' : ''
                        }`}
                        onClick={() => handleSymbolChange(opt.value)}
                      >
                        <span className="font-mono truncate">{opt.label}</span>
                        <span className={`badge badge-sm ${isSelected ? 'badge-primary' : 'badge-neutral'}`}>
                          {opt.count}
                        </span>
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
        
        <div className="p-2 overflow-y-auto flex-grow space-y-1">
          {loading ? (
            LOADING_SKELETON_ROWS.map((rowKey) => (
              <div key={rowKey} className="pointer-events-none rounded-xl border border-base-300/40 bg-base-100/20 px-3 py-2">
                <div className="flex justify-between items-center opacity-60">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 bg-base-300 rounded-lg animate-pulse" />
                    <div className="min-w-0">
                      <div className="h-4 w-28 bg-base-300 rounded animate-pulse mb-2" />
                      <div className="h-3 w-36 bg-base-300 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="h-5 w-16 bg-base-300 rounded-full animate-pulse" />
                </div>
              </div>
            ))
          ) : (
            trades.map((trade) => {
              const isSelected = selectedId === trade.id;
              const profitPositive = (trade.profit ?? 0) >= 0;

              return (
                <button
                  key={trade.id}
                  type="button"
                  className={`group flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                    isSelected
                      ? 'border-base-300 bg-base-100/60'
                      : 'border-transparent hover:border-base-300/60 hover:bg-base-100/25'
                  }`}
                  onClick={() => handleRowClick(trade)}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span
                      className={`grid h-8 w-8 place-items-center rounded-lg border ${
                        trade.direction === 'long'
                          ? 'border-success/25 bg-success/10 text-success'
                          : 'border-error/25 bg-error/10 text-error'
                      }`}
                    >
                      {trade.direction === 'long' ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <TrendingDown className="h-5 w-5" />
                      )}
                    </span>

                    <span className="min-w-0">
                      <span className="font-semibold block truncate">{trade.symbol}</span>
                      <span className="text-xs text-base-content/60 block truncate">
                        {new Date(trade.entry_time).toLocaleString('zh-CN')}
                      </span>
                    </span>
                  </span>

                  <span
                    className={`shrink-0 rounded-full border px-2 py-1 text-xs font-semibold ${
                      trade.profit == null
                        ? 'border-base-300/60 bg-base-200/30 text-base-content/70'
                        : profitPositive
                          ? 'border-success/25 bg-success/10 text-success'
                          : 'border-error/25 bg-error/10 text-error'
                    }`}
                    title={trade.profit == null ? '—' : trade.profit.toFixed(2)}
                  >
                    {trade.profit == null ? '—' : trade.profit.toFixed(2)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
