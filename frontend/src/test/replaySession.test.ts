import { describe, expect, it } from "vitest";
import type { Trade } from "../services/api";
import {
	createReplaySeedFromTrade,
	deserializeReplaySession,
	REPLAY_SESSION_VERSION,
	type ReplaySessionRecord,
	type ReplaySessionSeed,
	resolveReplaySessionSeed,
	serializeReplaySession,
} from "../utils/replaySession";

const makeTrade = (overrides: Partial<Trade> = {}): Trade => ({
	id: 42,
	symbol: "BTC-USDT",
	direction: "long",
	leverage: 3,
	entry_price: 100,
	exit_price: 120,
	profit: 20,
	profit_rate: 0.2,
	margin: 100,
	entry_time: 1712800000000,
	exit_time: 1712803600000,
	...overrides,
});

const makeSeed = (
	overrides: Partial<ReplaySessionSeed> = {},
): ReplaySessionSeed => ({
	tradeId: 7,
	symbol: "ETH-USDT",
	direction: "short",
	leverage: 5,
	entryPrice: 2000,
	exitPrice: 1950,
	profit: 50,
	profitRate: 0.025,
	margin: 150,
	entryTime: 1712800000000,
	exitTime: 1712803600000,
	...overrides,
});

describe("replaySession contract", () => {
	it("D-02-01 prefers route seed over local restore and latest trade", () => {
		const routeSeed = makeSeed({ tradeId: 11, symbol: "SOL-USDT" });
		const localSession: ReplaySessionRecord = {
			version: REPLAY_SESSION_VERSION,
			savedAt: 1712800000000,
			seed: makeSeed({ tradeId: 12, symbol: "XRP-USDT" }),
		};
		const latestTrade = makeTrade({ id: 13, symbol: "DOGE-USDT" });

		expect(
			resolveReplaySessionSeed({
				routeSeed,
				localSession,
				latestTrade,
			}),
		).toEqual(routeSeed);
	});

	it("D-02-01 restores the local session seed when route seed is absent", () => {
		const localSession: ReplaySessionRecord = {
			version: REPLAY_SESSION_VERSION,
			savedAt: 1712800000000,
			seed: makeSeed({ tradeId: 21, symbol: "ADA-USDT" }),
		};
		const latestTrade = makeTrade({ id: 22, symbol: "DOGE-USDT" });

		expect(
			resolveReplaySessionSeed({
				localSession,
				latestTrade,
			}),
		).toEqual(localSession.seed);
	});

	it("D-02-01 falls back to the latest trade when no replay seed exists", () => {
		const latestTrade = makeTrade({ id: 31, symbol: "BNB-USDT" });

		expect(resolveReplaySessionSeed({ latestTrade })).toEqual(
			createReplaySeedFromTrade(latestTrade),
		);
	});

	it("D-02-01 returns null when no replay source exists", () => {
		expect(resolveReplaySessionSeed({})).toBeNull();
	});

	it("D-02-01 round-trips a versioned browser-local replay session", () => {
		const record: ReplaySessionRecord = {
			version: REPLAY_SESSION_VERSION,
			savedAt: 1712800000000,
			seed: makeSeed({ defaultTimeframe: "1h" }),
		};

		const serialized = serializeReplaySession(record);

		expect(serialized).toBe(
			JSON.stringify({
				version: REPLAY_SESSION_VERSION,
				savedAt: 1712800000000,
				seed: record.seed,
			}),
		);
		expect(deserializeReplaySession(serialized)).toEqual(record);
	});

	it("D-02-01 keeps defaultTimeframe through replay seed round-trips", () => {
		const record: ReplaySessionRecord = {
			version: REPLAY_SESSION_VERSION,
			savedAt: 1712800000000,
			seed: makeSeed({ defaultTimeframe: "4h" }),
		};

		const restored = deserializeReplaySession(serializeReplaySession(record));

		expect(restored?.seed.defaultTimeframe).toBe("4h");
	});

	it("D-02-01 rejects stale replay session blobs", () => {
		const staleBlob = JSON.stringify({
			version: REPLAY_SESSION_VERSION - 1,
			savedAt: 1712800000000,
			seed: makeSeed(),
		});

		expect(deserializeReplaySession(staleBlob)).toBeNull();
	});

	it("D-02-01 ignores stale local payloads during precedence resolution", () => {
		const latestTrade = makeTrade({ id: 41, symbol: "BNB-USDT" });
		const staleLocalSession = deserializeReplaySession(
			JSON.stringify({
				version: REPLAY_SESSION_VERSION - 1,
				savedAt: 1712800000000,
				seed: makeSeed({ tradeId: 99, symbol: "BAD-USDT" }),
			}),
		);

		expect(
			resolveReplaySessionSeed({
				localSession: staleLocalSession,
				latestTrade,
			}),
		).toEqual(createReplaySeedFromTrade(latestTrade));
	});
});
