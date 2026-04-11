import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import ChartManager from "../components/ChartManager";
import PositionDetails from "../components/PositionDetails";
import ReplayAnalyticsPanel from "../components/ReplayAnalyticsPanel";
import TradeList from "../components/TradeList";
import type { Trade } from "../services/api";
import {
	createReplaySeedFromTrade,
	deserializeReplaySession,
	REPLAY_SESSION_STORAGE_KEY,
	type ReplaySessionSeed,
	serializeReplaySession,
} from "../utils/replaySession";
import {
	loadReplayWorkspace,
} from "../utils/replayWorkspace";

interface ReplayRouteState {
	seed?: ReplaySessionSeed | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const isReplaySeed = (value: unknown): value is ReplaySessionSeed => {
	if (!isRecord(value)) return false;

	return (
		typeof value.tradeId === "number" &&
		typeof value.symbol === "string" &&
		typeof value.direction === "string" &&
		typeof value.leverage === "number" &&
		typeof value.entryPrice === "number" &&
		(typeof value.exitPrice === "number" || value.exitPrice === null) &&
		(typeof value.profit === "number" || value.profit === null) &&
		(typeof value.profitRate === "number" || value.profitRate === null) &&
		(typeof value.margin === "number" || value.margin === null) &&
		typeof value.entryTime === "number" &&
		(typeof value.exitTime === "number" || value.exitTime === null)
	);
};

function resolveInitialSeed(routeState: unknown): ReplaySessionSeed | null {
	if (isRecord(routeState) && isReplaySeed(routeState.seed))
		return routeState.seed;
	if (isReplaySeed(routeState)) return routeState;

	if (typeof window === "undefined") return null;

	return (
		deserializeReplaySession(
			window.localStorage.getItem(REPLAY_SESSION_STORAGE_KEY) ?? "",
		)?.seed ?? null
	);
}

function seedToTrade(seed: ReplaySessionSeed): Trade {
	return {
		id: seed.tradeId,
		symbol: seed.symbol,
		direction: seed.direction,
		leverage: seed.leverage,
		entry_price: seed.entryPrice,
		exit_price: seed.exitPrice,
		profit: seed.profit,
		profit_rate: seed.profitRate,
		margin: seed.margin,
		entry_time: seed.entryTime,
		exit_time: seed.exitTime,
	};
}

export default function ReplayPage() {
	const location = useLocation();
	const [initialSeed] = useState(() =>
		resolveInitialSeed(
			location.state as ReplayRouteState | ReplaySessionSeed | null,
		),
	);
	const initialWorkspace = loadReplayWorkspace();
	const initialTimeframe =
		initialWorkspace?.activeTimeframe ?? initialSeed?.defaultTimeframe ?? "15m";
	const [symbol, setSymbol] = useState<string>(
		() => initialSeed?.symbol ?? initialWorkspace?.symbol ?? "",
	);
	const [selectedTrade, setSelectedTrade] = useState<Trade | null>(() => {
		return initialSeed ? seedToTrade(initialSeed) : null;
	});

	useEffect(() => {
		if (!selectedTrade && initialWorkspace?.symbol !== undefined && symbol !== initialWorkspace.symbol) {
			setSymbol(initialWorkspace.symbol);
		}
	}, [initialWorkspace, selectedTrade, symbol]);

	useEffect(() => {
		if (!selectedTrade) {
			window.localStorage.removeItem(REPLAY_SESSION_STORAGE_KEY);
			return;
		}

		window.localStorage.setItem(
			REPLAY_SESSION_STORAGE_KEY,
			serializeReplaySession({
				version: 1,
				savedAt: Date.now(),
				seed: createReplaySeedFromTrade(
					selectedTrade,
					initialSeed?.defaultTimeframe,
				),
			}),
		);
	}, [initialSeed?.defaultTimeframe, selectedTrade]);

	const handleSymbolChange = useCallback((nextSymbol: string) => {
		setSymbol(nextSymbol);
		setSelectedTrade(null);
	}, []);

	const handleSelectTrade = useCallback(
		(trade: Trade | null) => {
			setSelectedTrade(trade);
			if (trade && trade.symbol !== symbol) {
				setSymbol(trade.symbol);
			}
		},
		[symbol],
	);

	return (
		<div className="flex flex-col flex-grow min-h-0">
			<main className="flex-grow min-h-0 grid grid-cols-1 lg:grid-cols-[300px_1fr_280px] overflow-hidden">
				{/* TradeList Sidebar */}
			<aside className="flex flex-col border-r border-base-300 overflow-y-auto">
				<TradeList
					selectedTrade={selectedTrade}
					initialSymbol={symbol}
					workspaceBootstrap={Boolean(initialWorkspace)}
					onSelectTrade={handleSelectTrade}
					onSymbolChange={handleSymbolChange}
				/>
			</aside>

				{/* Main Chart */}
				<section className="flex flex-col overflow-hidden">
					{symbol ? (
						<ChartManager
							symbol={symbol}
							selectedTrade={selectedTrade}
							initialTimeframe={initialTimeframe}
						/>
					) : (
						<div className="flex-grow flex items-center justify-center">
							<p className="text-base-content/70">请选择交易对查看图表。</p>
						</div>
					)}
				</section>

				{/* Position Details */}
				<aside className="border-l border-base-300 overflow-y-auto">
					<div className="flex h-full flex-col gap-2 p-2">
						<ReplayAnalyticsPanel symbol={selectedTrade?.symbol || symbol} />
						<div className="min-h-0 flex-1">
							<PositionDetails trade={selectedTrade} />
						</div>
					</div>
				</aside>
			</main>
		</div>
	);
}
