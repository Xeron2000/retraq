import { useCallback, useState } from 'react';
import ChartManager from '../components/ChartManager';
import PositionDetails from '../components/PositionDetails';
import TradeList from '../components/TradeList';
import type { Trade } from '../services/api';

export default function ReplayPage() {
  const [symbol, setSymbol] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  const handleSymbolChange = useCallback((nextSymbol: string) => {
    setSymbol(nextSymbol);
    setSelectedTrade(null);
  }, []);
  
  const handleSelectTrade = useCallback((trade: Trade | null) => {
    setSelectedTrade(trade);
    if (trade && trade.symbol !== symbol) {
      setSymbol(trade.symbol);
    }
  }, [symbol]);

  return (
    <div className="flex flex-col flex-grow min-h-0">
      <main className="flex-grow min-h-0 grid grid-cols-1 lg:grid-cols-[300px_1fr_280px] overflow-hidden">
        {/* TradeList Sidebar */}
        <aside className="flex flex-col border-r border-base-300 overflow-y-auto">
          <TradeList onSelectTrade={handleSelectTrade} onSymbolChange={handleSymbolChange} />
        </aside>

        {/* Main Chart */}
        <section className="flex flex-col overflow-hidden">
          {symbol ? (
            <ChartManager symbol={symbol} selectedTrade={selectedTrade} />
          ) : (
            <div className="flex-grow flex items-center justify-center">
              <p className="text-base-content/70">请选择交易对查看图表。</p>
            </div>
          )}
        </section>

        {/* Position Details */}
        <aside className="border-l border-base-300 overflow-y-auto">
          <PositionDetails trade={selectedTrade} />
        </aside>
      </main>
    </div>
  );
}
