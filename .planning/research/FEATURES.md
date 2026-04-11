# Retraq Feature Framing

Retraq v1 is a personal, local-first crypto trade replay tool. The center of gravity is simple, import trades from Excel or manual files, open one trade fast, line it up with the right K-line window, compare a small number of timeframes, and review the outcome without leaving the app.

## V1 should feel like

* Import a sheet, fix any obvious mapping issues, and land in the replay list.
* Open one trade and jump straight into a replay view that already shows the right symbol, time window, and markers.
* Compare a few timeframes side by side without turning the app into a generic charting terminal.
* See only the metrics that help with review, not a wall of analytics.

## Table stakes

* Excel or manual import with sane validation, timezone handling, duplicate handling, and clear row level errors.
* Trade list with search, symbol filter, date filter, and quick open into replay.
* Replay controls, play and pause, step forward, speed control, and a way to resume from the last state.
* K-line view with correct trade markers, entry and exit context, and enough history to inspect the setup.
* Multi-timeframe comparison for the same symbol, synced well enough to answer, “What was the higher timeframe doing here?”
* Lightweight analytics, such as win rate, PnL, average hold time, drawdown, and symbol split.
* Local persistence for imports, replay state, and layout choices.

## Differentiators

* Local-first by default, no login, no cloud sync, no team workflow, and no hidden backend dependency for core use.
* Excel first import flow, because this product starts from the user’s own records, not from broker sync.
* Replay centered on imported trades, not on generic chart browsing. The trade is the primary object, the chart is the context.
* Multi-timeframe compare as a review aid, not as a full multi-chart workstation.
* Lightweight analytics that support replay decisions, instead of competing with the replay surface for attention.
* Clear gap handling when market history is missing, because external K-line coverage is not fully controllable.

## Anti-features

* No account system, permissions, sharing, or collaboration.
* No cloud sync, remote backup service, or public SaaS deployment work.
* No broker auto-sync as the v1 source of truth.
* No live trading, paper trading, order routing, or execution simulation.
* No education hub, course library, social feed, battles, leaderboard, or AI mentor.
* No heavy BI layer, custom dashboard builder, alert system, or broad strategy backtester.
* No tick replay, exotic chart types, or order book style depth visuals unless a later use case proves it matters.

## Complexity and dependency notes for this brownfield repo

* `backend/services/kline_service.py` depends on external exchange data through CCXT and local cache, so replay depth is bounded by what the source can provide.
* `backend/services/trade_importer.py` and `backend/import_data.py` already anchor the product to Excel style input and SQLite, so schema changes should stay additive and small.
* `frontend/src/components/ChartManager.tsx` is the main complexity hotspot. Any replay or multi-timeframe work should preserve one coherent trade centric flow.
* `frontend/src/pages/AnalysisPage.tsx` already does its own heavier front end analysis, so v1 should not pile more product logic into that path.
* The repo currently has no strong test harness and already carries lint or type debt, so feature work should stay narrow and verifiable.
* Because the product is personal and local, shipping value matters more than building infrastructure for future multi user needs.
