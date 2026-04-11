# Roadmap: Retraq

## Overview

Retraq is a local-first crypto trade replay tool. v1 focuses on one tight workflow: import historical trades, align each trade to the right market window, compare a few supporting timeframes, and keep the local review state stable enough for repeated use.

## Phases

- [ ] **Phase 1: Import Reliability & Schema Evolution** - Make Excel/manual import trustworthy and keep local trade data stable.
- [ ] **Phase 2: Single-Trade Replay Core** - Open any trade fast and land on the correct replay window.
- [ ] **Phase 3: Multi-Timeframe Compare & Lightweight Analytics** - Add supporting comparison and metrics without turning into a dashboard.
- [ ] **Phase 4: Local UX Polish & Performance Hardening** - Keep the app responsive and remember local review state.

## Phase Details

### Phase 1: Import Reliability & Schema Evolution
**Goal**: Users can reliably import historical trades and trust the stored data.
**Depends on**: Nothing (first phase)
**Requirements**: IMPT-01, IMPT-02, IMPT-03, IMPT-04, IMPT-05
**Success Criteria** (what must be TRUE):
  1. User can import trades from an Excel file into the local system.
  2. User can see row-level errors for records that fail to import.
  3. User can re-import source rows without creating duplicate trades.
  4. User can review an import report that summarizes successes, failures, duplicates, and normalized timestamps.
**Plans**: 4 plans
**UI hint**: yes

### Phase 2: Single-Trade Replay Core
**Goal**: Users can open a single trade and replay it in the correct context.
**Depends on**: Phase 1
**Requirements**: REPL-01, REPL-02, REPL-03, REPL-04, STAT-02
**Success Criteria** (what must be TRUE):
  1. User can open any trade from the list directly into replay.
  2. Replay opens on the correct symbol, time window, and default timeframe for the selected trade.
  3. User can see entry/exit markers and relevant price lines on the chart.
  4. User can control play, pause, step, and speed, and resume the selected trade from saved progress.
**Plans**: 4 plans
**UI hint**: yes

### Phase 3: Multi-Timeframe Compare & Lightweight Analytics
**Goal**: Users can compare a trade across timeframes and read basic review metrics.
**Depends on**: Phase 2
**Requirements**: COMP-01, COMP-02, COMP-03, ANLY-01, ANLY-02, ANLY-03
**Success Criteria** (what must be TRUE):
  1. User can compare the selected trade across multiple timeframes for the same symbol.
  2. User can change the comparison timeframe without leaving replay.
  3. Compared charts stay synchronized by visible time range and crosshair position.
  4. User can view win rate, PnL, profit-loss ratio, equity curve, time/symbol distributions, and drawdown stats.
**Plans**: 4 plans
**UI hint**: yes

### Phase 4: Local UX Polish & Performance Hardening
**Goal**: Users can keep their local replay workspace lightweight, persistent, and pleasant to use.
**Depends on**: Phase 3
**Requirements**: STAT-01, STAT-03
**Success Criteria** (what must be TRUE):
  1. User can return later and find the last-used replay layout and filters restored.
  2. User can export or back up local review data for safekeeping.
**Plans**: 3 plans
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Import Reliability & Schema Evolution | 0/4 | Not started | - |
| 2. Single-Trade Replay Core | 0/4 | Not started | - |
| 3. Multi-Timeframe Compare & Lightweight Analytics | 0/4 | Not started | - |
| 4. Local UX Polish & Performance Hardening | 0/3 | Not started | - |
