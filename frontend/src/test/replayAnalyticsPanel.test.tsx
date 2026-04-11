import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ReplayAnalyticsPanel from "../components/ReplayAnalyticsPanel";
import {
	deserializeReplayWorkspace,
	REPLAY_WORKSPACE_STORAGE_KEY,
	REPLAY_WORKSPACE_VERSION,
	serializeReplayWorkspace,
} from "../utils/replayWorkspace";

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
}));

function seedWorkspaceRecord(record: Record<string, unknown>) {
	window.localStorage.setItem(
		REPLAY_WORKSPACE_STORAGE_KEY,
		serializeReplayWorkspace(record as never),
	);
}

describe("replay analytics panel persistence", () => {
	beforeEach(() => {
		localStorageStore.clear();
		vi.stubGlobal("localStorage", localStorageMock as Storage);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("restores an open analytics panel from replay workspace", () => {
		seedWorkspaceRecord({
			version: REPLAY_WORKSPACE_VERSION,
			savedAt: 1_712_800_000_000,
			symbol: "SOL-USDT",
			analyticsPanelOpen: true,
		});

		render(<ReplayAnalyticsPanel symbol="SOL-USDT" />);

		expect(screen.getByRole("button", { name: "复盘分析" })).toHaveAttribute(
			"aria-expanded",
			"true",
		);
	});

	it("persists analytics panel open state and restores it on the next visit", async () => {
		const user = userEvent.setup();

		const { unmount } = render(<ReplayAnalyticsPanel symbol="SOL-USDT" />);

		await user.click(screen.getByRole("button", { name: "复盘分析" }));

		await waitFor(() => {
			expect(screen.getByRole("button", { name: "复盘分析" })).toHaveAttribute(
				"aria-expanded",
				"true",
			);
		});

		const savedWorkspace = deserializeReplayWorkspace(
			window.localStorage.getItem(REPLAY_WORKSPACE_STORAGE_KEY) ?? "",
		);

		expect(savedWorkspace).toMatchObject({
			version: REPLAY_WORKSPACE_VERSION,
			symbol: "SOL-USDT",
			analyticsPanelOpen: true,
		});
		expect(savedWorkspace).not.toHaveProperty("fullscreen");

		unmount();

		render(<ReplayAnalyticsPanel symbol="SOL-USDT" />);

		expect(screen.getByRole("button", { name: "复盘分析" })).toHaveAttribute(
			"aria-expanded",
			"true",
		);
	});
});
