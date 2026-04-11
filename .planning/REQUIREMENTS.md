# Requirements: Retraq

**Defined:** 2026-04-11
**Core Value:** 导入一笔历史交易后，能够快速把它和对应 K 线、买卖点、时间区间对齐，并顺畅完成一次高质量复盘。

## v1 Requirements

### Import

- [ ] **IMPT-01**: User can import historical trades from an Excel file into the local system
- [ ] **IMPT-02**: User can see row-level import errors when a trade record cannot be imported
- [ ] **IMPT-03**: User can import trades without creating duplicate records for the same source rows
- [ ] **IMPT-04**: User can have imported trade timestamps normalized into a consistent internal time standard
- [ ] **IMPT-05**: User can review an import report that summarizes successful rows, failed rows, and duplicate handling

### Replay

- [ ] **REPL-01**: User can open any single trade from the trade list directly into replay view
- [ ] **REPL-02**: User can have replay automatically aligned to the correct symbol, time window, and default timeframe for the selected trade
- [ ] **REPL-03**: User can see entry and exit markers, plus relevant price lines, on the replay chart for the selected trade
- [ ] **REPL-04**: User can control replay with play, pause, step, and speed adjustment actions

### Compare

- [ ] **COMP-01**: User can compare the selected trade across multiple timeframes for the same symbol
- [ ] **COMP-02**: User can keep compared charts synchronized by visible time range and crosshair position
- [ ] **COMP-03**: User can change the timeframe of the comparison chart without leaving the replay flow

### Analytics

- [ ] **ANLY-01**: User can view core replay-supporting metrics including win rate, PnL, profit-loss ratio, and equity curve
- [ ] **ANLY-02**: User can view distributions by time period and by trading symbol to support review
- [ ] **ANLY-03**: User can view drawdown-related statistics for imported trades

### Local State

- [ ] **STAT-01**: User can return to the last-used replay layout and filters in a later session
- [ ] **STAT-02**: User can resume replay from the previously saved progress of a selected trade
- [ ] **STAT-03**: User can export or back up local review data for safekeeping

## v2 Requirements

### Compare Expansion

- **COMP-04**: User can compare multiple different symbols on screen at the same time

### Advanced Analysis

- **ANLY-04**: User can view advanced attribution and behavior analysis beyond core replay metrics

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-user accounts and permissions | Product is explicitly scoped as a personal local tool |
| Cloud sync and remote backup service | v1 should stay local-first and avoid premature sync complexity |
| Direct OKX account sync as primary v1 input | v1 input is intentionally Excel/manual import first |
| Public SaaS deployment hardening | Current product is not being planned as a public service |
| Live trading, paper trading, or order routing | Replay and review are the goal, not execution |
| Education hub expansion | Learning content is not part of the current core replay milestone |
| Generic BI/dashboard builder | Replay flow matters more than broad analytics surface area |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 0
- Unmapped: 18 ⚠️

---
*Requirements defined: 2026-04-11*
*Last updated: 2026-04-11 after initial definition*
