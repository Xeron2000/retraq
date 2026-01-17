import type { Trade } from '../services/api';

function DetailRow({ label, value, valueClassName = '' }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <div className="text-base-content/70">{label}</div>
      <div className={`font-semibold text-right ${valueClassName}`.trim()}>{value}</div>
    </div>
  );
}

export default function PositionDetails({ trade }: { trade: Trade | null }) {
  if (!trade) {
    return (
      <div className="bg-base-200 h-full p-4">
        <div className="text-base-content/70">请选择一笔交易查看仓位详情。</div>
      </div>
    );
  }

  const directionLabel = trade.direction === 'long' ? '多' : trade.direction === 'short' ? '空' : trade.direction;
  const directionColor = trade.direction === 'long' ? 'text-success' : trade.direction === 'short' ? 'text-error' : '';
  const profitColor = (trade.profit ?? 0) >= 0 ? 'text-success' : 'text-error';

  return (
    <div className="bg-base-200 h-full p-4 space-y-4 overflow-y-auto">
      <h3 className="font-bold text-lg">仓位详情</h3>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4 space-y-2">
          <DetailRow label="交易对" value={trade.symbol} />
          <DetailRow label="方向" value={directionLabel} valueClassName={directionColor} />
          <DetailRow label="杠杆" value={trade.leverage?.toString?.() ?? '—'} />
          <DetailRow label="保证金" value={trade.margin == null ? '—' : `$${trade.margin.toFixed(2)}`} />
          <DetailRow label="开仓时间" value={new Date(trade.entry_time).toLocaleString('zh-CN')} />
          <DetailRow label="开仓均价" value={trade.entry_price.toFixed(4)} />
          <DetailRow label="平仓时间" value={trade.exit_time == null ? '—' : new Date(trade.exit_time).toLocaleString('zh-CN')} />
          <DetailRow label="平仓均价" value={trade.exit_price == null ? '—' : trade.exit_price.toFixed(4)} />
          <div className="divider my-2" />
          <div className={`flex justify-between items-center text-sm ${profitColor}`}>
            <div>盈亏</div>
            <div className="font-bold">{trade.profit == null ? '—' : trade.profit.toFixed(2)}</div>
          </div>
          <DetailRow label="收益率" value={trade.profit_rate == null ? '—' : `${(trade.profit_rate * 100).toFixed(2)}%`} />
        </div>
      </div>
    </div>
  );
}
