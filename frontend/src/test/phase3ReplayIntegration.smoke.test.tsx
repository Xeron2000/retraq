import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ReplayPage from "../pages/ReplayPage";
import { buildReplayProgressStorageKey } from "../utils/replayPlayback";
import type { ReplaySessionSeed } from "../utils/replaySession";
import {
	REPLAY_WORKSPACE_STORAGE_KEY,
	REPLAY_WORKSPACE_VERSION,
	serializeReplayWorkspace,
} from "../utils/replayWorkspace";

const {
	markerSetSpy,
	createSeriesMarkersSpy,
	createPriceLineSpy,
	removePriceLineSpy,
	setVisibleRangeSpy,
} = vi.hoisted(() => ({
	markerSetSpy: vi.fn(),
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

const routeSeed: ReplaySessionSeed = {
	tradeId: 11,
	symbol: "SOL-USDT",
	direction: "long",
	leverage: 3,
	entryPrice: 101,
	exitPrice: 111,
	profit: 10,
	profitRate: 0.1,
	margin: 100,
	entryTime: 1_712_800_000_000,
	exitTime: 1_712_800_900_000,
};

vi.mock("../components/TradeList", () => ({
	default: ({ selectedTrade }: { selectedTrade?: { id?: number } | null }) => (
		<div data-testid="trade-list" data-trade-id={selectedTrade?.id ?? ""} />
	),
}));

vi.mock("../components/PositionDetails", () => ({
	default: ({ trade }: { trade?: { id?: number } | null }) => (
		<div data-testid="position-details" data-trade-id={trade?.id ?? ""} />
	),
}));

vi.mock("../services/api", () => ({
	fetchStats: vi.fn(async () => ({
		total_pnl: 10,
		win_rate: 66.7,
		profit_factor: 2.5,
		max_drawdown: 10,
		avg_holding_time: 1.8,
		symbol_distribution: {
			"SOL-USDT": 3,
			"BTC-USDT": 2,
		},
		trade_count: 5,
	})),
	fetchTrades: vi.fn(async () => []),
	fetchKlines: vi.fn(async () => {
		const base = Math.floor(routeSeed.entryTime / 1000);
		return Array.from({ length: 12 }, (_, index) => ({
			time: base + index * 900,
			open: 100 + index,
			high: 101 + index,
			low: 99 + index,
			close: 100.5 + index,
			volume: 10 + index,
		}));
	}),
	importTrades: vi.fn(),
}));

vi.mock("lightweight-charts", () => {
	const createSeries = () => ({
		setData: vi.fn(),
		createPriceLine: createPriceLineSpy,
		removePriceLine: removePriceLineSpy,
	});

	const createTimeScale = () => ({
		setVisibleRange: setVisibleRangeSpy,
		getVisibleRange: vi.fn(() => ({
			from: Math.floor(routeSeed.entryTime / 1000),
			to: Math.floor((routeSeed.exitTime ?? routeSeed.entryTime) / 1000),
		})),
		subscribeVisibleTimeRangeChange: vi.fn(),
		subscribeVisibleLogicalRangeChange: vi.fn(),
		unsubscribeVisibleTimeRangeChange: vi.fn(),
		unsubscribeVisibleLogicalRangeChange: vi.fn(),
		setVisibleLogicalRange: vi.fn(),
	});

	return {
		CandlestickSeries: Symbol("CandlestickSeries"),
		HistogramSeries: Symbol("HistogramSeries"),
		LineSeries: Symbol("LineSeries"),
		createSeriesMarkers: createSeriesMarkersSpy.mockImplementation(() => ({
			setMarkers: markerSetSpy,
		})),
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

function renderReplayPage(routeState?: ReplaySessionSeed | null) {
	return render(
		<MemoryRouter
			initialEntries={[
				{
					pathname: "/replay",
					state: routeState ? { seed: routeState } : undefined,
				},
			]}
		>
			<ReplayPage />
		</MemoryRouter>,
	);
}

describe("Phase 3 replay integration smoke", () => {
	beforeEach(() => {
		markerSetSpy.mockClear();
		createSeriesMarkersSpy.mockClear();
		createPriceLineSpy.mockClear();
		removePriceLineSpy.mockClear();
		setVisibleRangeSpy.mockClear();
		localStorageStore.clear();
		vi.stubGlobal("localStorage", localStorageMock as Storage);
		vi.stubGlobal(
			"ResizeObserver",
			ResizeObserverMock as unknown as typeof ResizeObserver,
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("keeps both compare modes working after the replay analytics panel mounts", async () => {
		const user = userEvent.setup();

		renderReplayPage(routeSeed);

		expect(
			screen.getByRole("button", { name: "复盘分析" }),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "交易对" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "周期" })).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "复盘分析" }));

		await waitFor(() => {
			expect(screen.getByText("总盈亏")).toBeInTheDocument();
			expect(screen.getByRole("img", { name: "收益曲线" })).toBeInTheDocument();
		});

		await user.click(screen.getByRole("button", { name: "交易对" }));

		expect(
			await screen.findByRole("button", { name: /对比: BTC-USDT/ }),
		).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "周期" }));

		expect(await screen.findByText("对比: SOL-USDT")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "交易对" })).toHaveAttribute(
			"aria-pressed",
			"false",
		);
		expect(screen.getByRole("button", { name: "周期" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
	});

	it("still boots replay from the route seed and persists replay progress", async () => {
		const user = userEvent.setup();

		renderReplayPage(routeSeed);

		expect(screen.getByTestId("trade-list")).toHaveAttribute(
			"data-trade-id",
			String(routeSeed.tradeId),
		);
		expect(screen.getByTestId("position-details")).toHaveAttribute(
			"data-trade-id",
			String(routeSeed.tradeId),
		);

		await waitFor(() => {
			expect(createPriceLineSpy).toHaveBeenCalled();
			expect(createSeriesMarkersSpy).toHaveBeenCalled();
		});

		await user.click(screen.getByRole("button", { name: "前进一步" }));

		await waitFor(() => {
			const raw = window.localStorage.getItem(
				buildReplayProgressStorageKey(routeSeed.tradeId),
			);
			const parsed = raw ? JSON.parse(raw) : null;
			expect(parsed?.cursorTime).toBeGreaterThan(routeSeed.entryTime);
		});
	});

	it("restores durable replay layout preferences without breaking replay bootstrap", async () => {
		window.localStorage.setItem(
			REPLAY_WORKSPACE_STORAGE_KEY,
			serializeReplayWorkspace({
				version: REPLAY_WORKSPACE_VERSION,
				savedAt: 1_712_900_000_000,
				symbol: routeSeed.symbol,
				activeTimeframe: "1h",
				compareMode: "timeframe",
				compareSymbol: "BTC-USDT",
				compareTimeframe: "1d",
				analyticsPanelOpen: true,
			}),
		);

		renderReplayPage(routeSeed);

		expect(screen.getByRole("button", { name: "1h" })).toHaveClass(
			"tab-active",
		);
		expect(screen.getByRole("button", { name: "周期" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(screen.getByRole("button", { name: "对比周期 1d" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(screen.getByRole("button", { name: "复盘分析" })).toHaveAttribute(
			"aria-expanded",
			"true",
		);

		await waitFor(() => {
			expect(screen.getByText("总盈亏")).toBeInTheDocument();
			expect(screen.getByRole("img", { name: "收益曲线" })).toBeInTheDocument();
		});
	});
});
