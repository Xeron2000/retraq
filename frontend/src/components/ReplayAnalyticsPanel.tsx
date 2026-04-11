import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { StatsOverview, Trade } from "../services/api";
import { fetchStats, fetchTrades } from "../services/api";
import { loadReplayWorkspace, saveReplayWorkspace } from "../utils/replayWorkspace";
import {
	analyzeRisk,
	analyzeSymbols,
	analyzeTimePatterns,
} from "../utils/tradeAnalysis";

const TRADES_FETCH_LIMIT = 200;
const TRADES_FETCH_MAX_PAGES = 20;

const formatMoney = (value: number | null | undefined) =>
	value == null || !Number.isFinite(value) ? "—" : value.toFixed(2);

const formatPercent = (value: number | null | undefined) =>
	value == null || !Number.isFinite(value) ? "—" : `${value.toFixed(1)}%`;

const formatRatio = (value: number | null | undefined) =>
	value == null || !Number.isFinite(value) ? "—" : value.toFixed(2);

function SummaryCard({
	label,
	value,
	detail,
	tone = "text-base-content",
}: {
	label: string;
	value: string;
	detail?: string;
	tone?: string;
}) {
	return (
		<div className="rounded-xl border border-base-300 bg-base-200/70 p-3">
			<div className="text-[11px] uppercase tracking-wide text-base-content/60">
				{label}
			</div>
			<div className={`mt-1 text-lg font-semibold ${tone}`}>{value}</div>
			{detail ? (
				<div className="mt-1 text-[11px] text-base-content/60">{detail}</div>
			) : null}
		</div>
	);
}

function EquityCurve({ trades }: { trades: Trade[] }) {
	const points = useMemo(() => {
		const sorted = trades
			.filter((trade) => typeof trade.profit === "number")
			.sort((a, b) => a.entry_time - b.entry_time);
		let cumulative = 0;

		return sorted.map((trade, index) => {
			cumulative += trade.profit ?? 0;
			return {
				index,
				value: cumulative,
				label: `${new Date(trade.entry_time).toLocaleDateString("zh-CN")} · ${trade.symbol}`,
			};
		});
	}, [trades]);

	const path = useMemo(() => {
		if (points.length === 0) return "";

		const minValue = Math.min(0, ...points.map((point) => point.value));
		const maxValue = Math.max(0, ...points.map((point) => point.value));
		const range = maxValue - minValue || 1;
		const width = Math.max(points.length - 1, 1);

		return points
			.map((point, index) => {
				const x = (index / width) * 100;
				const y = 100 - ((point.value - minValue) / range) * 100;
				return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
			})
			.join(" ");
	}, [points]);

	const fillPath = useMemo(() => {
		if (points.length === 0) return "";
		const minValue = Math.min(0, ...points.map((point) => point.value));
		const maxValue = Math.max(0, ...points.map((point) => point.value));
		const range = maxValue - minValue || 1;
		const width = Math.max(points.length - 1, 1);

		const linePoints = points.map((point, index) => {
			const x = (index / width) * 100;
			const y = 100 - ((point.value - minValue) / range) * 100;
			return { x, y };
		});

		const first = linePoints[0];
		const last = linePoints[linePoints.length - 1];
		return [
			`M ${first.x.toFixed(2)} 100`,
			`L ${first.x.toFixed(2)} ${first.y.toFixed(2)}`,
			...linePoints
				.slice(1)
				.map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`),
			`L ${last.x.toFixed(2)} 100`,
			"Z",
		].join(" ");
	}, [points]);

	const lastValue = points.at(-1)?.value ?? 0;

	return (
		<div className="rounded-xl border border-base-300 bg-base-200/70 p-3">
			<div className="flex items-center justify-between gap-3">
				<div>
					<div className="text-xs text-base-content/60">收益曲线</div>
					<div
						className={`text-sm font-semibold ${lastValue >= 0 ? "text-success" : "text-error"}`}
					>
						{formatMoney(lastValue)}
					</div>
				</div>
				<div className="text-[11px] text-base-content/50">按开仓时间累积</div>
			</div>

			<div aria-label="收益曲线" className="mt-3" role="img">
				<svg
					className="h-24 w-full"
					preserveAspectRatio="none"
					viewBox="0 0 100 100"
				>
					<title>收益曲线</title>
					<defs>
						<linearGradient id="replay-equity-fill" x1="0" x2="0" y1="0" y2="1">
							<stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
							<stop offset="100%" stopColor="currentColor" stopOpacity="0" />
						</linearGradient>
					</defs>
					<path
						d="M 0 50 L 100 50"
						fill="none"
						stroke="rgba(148, 163, 184, 0.4)"
						strokeDasharray="3 4"
						strokeWidth="1"
					/>
					{fillPath ? (
						<path
							d={fillPath}
							fill="url(#replay-equity-fill)"
							className={lastValue >= 0 ? "text-success" : "text-error"}
						/>
					) : null}
					{path ? (
						<path
							d={path}
							fill="none"
							className={lastValue >= 0 ? "text-success" : "text-error"}
							stroke="currentColor"
							strokeWidth="2.5"
						/>
					) : null}
				</svg>
			</div>

			<div className="mt-2 flex items-center justify-between text-[11px] text-base-content/60">
				<span>{points.length > 0 ? points[0].label : "暂无交易数据"}</span>
				<span>{points.length > 0 ? points.at(-1)?.label : "等待数据"}</span>
			</div>
		</div>
	);
}

function HourHeatmap({
	hourlyStats,
}: {
	hourlyStats: ReturnType<typeof analyzeTimePatterns>["hourlyStats"];
}) {
	return (
		<div className="grid grid-cols-6 gap-1 sm:grid-cols-8 lg:grid-cols-12">
			{hourlyStats.map((hour) => {
				const intensity = Math.min(
					1,
					hour.trades / Math.max(...hourlyStats.map((item) => item.trades), 1),
				);
				const tone =
					hour.trades === 0
						? "bg-base-300/80"
						: hour.winRate >= 0.5
							? "bg-success/20"
							: "bg-error/20";

				return (
					<div
						key={hour.hour}
						className={`flex aspect-square items-center justify-center rounded-md border border-base-300 text-[10px] font-mono ${tone}`}
						style={{ opacity: hour.trades === 0 ? 0.6 : 0.4 + intensity * 0.6 }}
						title={`${String(hour.hour).padStart(2, "0")}:00 · ${hour.trades} 笔 · 胜率 ${formatPercent(hour.winRate * 100)}`}
					>
						{String(hour.hour).padStart(2, "0")}
					</div>
				);
			})}
		</div>
	);
}

function SymbolDistribution({
	symbolStats,
	focusSymbol,
}: {
	symbolStats: ReturnType<typeof analyzeSymbols>["symbolStats"];
	focusSymbol: string;
}) {
	return (
		<div className="overflow-hidden rounded-xl border border-base-300 bg-base-200/70">
			<div className="border-b border-base-300 px-3 py-2">
				<div className="text-xs text-base-content/60">交易对分布</div>
			</div>
			<div className="max-h-52 overflow-y-auto">
				<table className="table table-xs">
					<thead>
						<tr>
							<th>交易对</th>
							<th className="text-right">交易数</th>
							<th className="text-right">胜率</th>
							<th className="text-right">盈亏</th>
						</tr>
					</thead>
					<tbody>
						{symbolStats.slice(0, 6).map((stat) => (
							<tr
								key={stat.symbol}
								className={stat.symbol === focusSymbol ? "bg-primary/10" : ""}
							>
								<td className="font-mono">{stat.symbol}</td>
								<td className="text-right">{stat.trades}</td>
								<td
									className={`text-right ${stat.winRate >= 0.5 ? "text-success" : "text-error"}`}
								>
									{(stat.winRate * 100).toFixed(1)}%
								</td>
								<td
									className={`text-right font-mono ${stat.totalPnl >= 0 ? "text-success" : "text-error"}`}
								>
									{formatMoney(stat.totalPnl)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

export default function ReplayAnalyticsPanel({ symbol }: { symbol: string }) {
	const [isOpen, setIsOpen] = useState(
		() => loadReplayWorkspace()?.analyticsPanelOpen ?? false,
	);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [stats, setStats] = useState<StatsOverview | null>(null);
	const [trades, setTrades] = useState<Trade[]>([]);

	useEffect(() => {
		saveReplayWorkspace(symbol, { analyticsPanelOpen: isOpen });
	}, [isOpen, symbol]);

	useEffect(() => {
		const hasLoaded = stats != null || trades.length > 0;
		if (!isOpen || hasLoaded) return;

		let active = true;
		setIsLoading(true);
		setError(null);

		Promise.all([
			fetchStats(),
			fetchTrades(undefined, {
				limit: TRADES_FETCH_LIMIT,
				maxPages: TRADES_FETCH_MAX_PAGES,
			}),
		])
			.then(([nextStats, nextTrades]) => {
				if (!active) return;
				setStats(nextStats);
				setTrades(nextTrades);
			})
			.catch((err) => {
				if (!active) return;
				setError(err instanceof Error ? err.message : String(err));
			})
			.finally(() => {
				if (!active) return;
				setIsLoading(false);
			});

		return () => {
			active = false;
		};
	}, [isOpen, stats, trades.length]);

	const timeAnalysis = useMemo(() => analyzeTimePatterns(trades), [trades]);
	const symbolAnalysis = useMemo(() => analyzeSymbols(trades), [trades]);
	const riskAnalysis = useMemo(() => analyzeRisk(trades), [trades]);

	const summaryCards = stats
		? [
				{
					label: "总盈亏",
					value: formatMoney(stats.total_pnl),
					tone: stats.total_pnl >= 0 ? "text-success" : "text-error",
					detail: "来自复盘交易总表",
				},
				{
					label: "胜率",
					value: formatPercent(stats.win_rate),
					tone: stats.win_rate >= 50 ? "text-success" : "text-error",
					detail: "按已关闭交易统计",
				},
				{
					label: "利润因子",
					value: formatRatio(stats.profit_factor),
					tone: stats.profit_factor >= 1 ? "text-info" : "text-warning",
					detail: "收益 / 亏损",
				},
				{
					label: "最大回撤",
					value: formatMoney(stats.max_drawdown),
					tone: "text-error",
					detail: "越小越稳",
				},
				{
					label: "交易次数",
					value: String(stats.trade_count),
					tone: "text-base-content",
					detail: `均持仓 ${formatMoney(stats.avg_holding_time)} 小时`,
				},
			]
		: [];

	return (
		<section className="rounded-box border border-base-300 bg-base-100">
			<button
				aria-expanded={isOpen}
				aria-label="复盘分析"
				className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-base-200/40"
				onClick={() => setIsOpen((current) => !current)}
				type="button"
			>
				<span className="min-w-0">
					<span className="block text-sm font-semibold">复盘分析</span>
					<span className="block text-[11px] text-base-content/60">
						展开后加载当前复盘的轻量统计、曲线与分布
					</span>
				</span>
				<span className="flex items-center gap-2 shrink-0 text-xs text-base-content/60">
					<span className="badge badge-ghost badge-sm">{symbol || "—"}</span>
					<ChevronDown
						className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
					/>
				</span>
			</button>

			{isOpen ? (
				<div className="border-t border-base-300 px-3 py-3">
					<div className="mb-3 flex items-center justify-between gap-3">
						<div className="text-xs text-base-content/60">
							当前交易对{" "}
							<span className="font-mono text-base-content">
								{symbol || "—"}
							</span>
						</div>
						<div className="text-[11px] text-base-content/50">
							只在展开时加载，避免干扰主复盘流
						</div>
					</div>

					{isLoading ? (
						<div className="rounded-xl border border-base-300 bg-base-200/70 px-4 py-6 text-center text-sm text-base-content/60">
							正在加载复盘分析…
						</div>
					) : error ? (
						<div className="alert alert-error">
							<span>{error}</span>
						</div>
					) : (
						<div className="space-y-3">
							<div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
								{summaryCards.map((card) => (
									<SummaryCard
										key={card.label}
										label={card.label}
										value={card.value}
										detail={card.detail}
										tone={card.tone}
									/>
								))}
							</div>

							<EquityCurve trades={trades} />

							<div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.1fr_0.9fr]">
								<div className="rounded-xl border border-base-300 bg-base-200/70 p-3">
									<div className="flex items-center justify-between gap-3">
										<div>
											<div className="text-xs text-base-content/60">
												交易时段分布
											</div>
											<div className="text-[11px] text-base-content/50">
												按开仓时间统计，帮助快速识别活跃窗口
											</div>
										</div>
										<div className="text-[11px] text-base-content/50">
											{riskAnalysis.currentStreak.type === "none"
												? "无当前连胜/连亏"
												: `${riskAnalysis.currentStreak.type === "win" ? "连胜" : "连亏"} ${riskAnalysis.currentStreak.count} 笔`}
										</div>
									</div>
									<div className="mt-3">
										<HourHeatmap hourlyStats={timeAnalysis.hourlyStats} />
									</div>
								</div>

								<SymbolDistribution
									symbolStats={symbolAnalysis.symbolStats}
									focusSymbol={symbol}
								/>
							</div>
						</div>
					)}
				</div>
			) : null}
		</section>
	);
}
