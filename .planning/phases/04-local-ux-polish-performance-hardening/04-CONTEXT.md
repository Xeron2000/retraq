# Phase 4: Local UX Polish & Performance Hardening - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning/execution

<domain>
## Phase Boundary

Phase 4 只做本地用户体验收口与数据保全：
- 恢复上次 replay workspace 的 layout / filters
- 提供用户可见的本地导出 / 备份 / 恢复入口

不扩展到云同步、多用户、远程存储或全新分析系统。

</domain>

<decisions>
## Implementation Decisions

### Workspace 恢复边界
- **D-04-01:** 继续复用现有 `replaySession` / `replayPlayback` 作为 trade seed 与 replay progress 的 durable source。
- **D-04-02:** 新增独立的 replay workspace 存储层，只承载 layout / filters：symbol filter、active timeframe、compare mode、compare symbol、compare timeframe、analytics panel open state。
- **D-04-03:** `route seed > replay session > workspace filter bootstrap > latest trade default` 的优先级保持不变。
- **D-04-04:** fullscreen 不做 durable restore；它是浏览器瞬时状态，不属于可安全恢复的 workspace。

### 导出 / 备份边界
- **D-04-05:** 复用现有 import report CSV 下载链路作为“明细导出”能力，不另造一套报表导出。
- **D-04-06:** 复用现有 migration backup 逻辑提供用户可见的 SQLite backup 下载。
- **D-04-07:** Phase 4 允许本地 restore 入口，但只支持与本地 SQLite backup 同格式的文件，不做跨格式导入。
- **D-04-08:** 用户可见 safekeeping 入口放在 `/import` 页，因为它已经拥有 import report download 语义和数据保全入口。

</decisions>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/STATE.md`
- `frontend/src/pages/ReplayPage.tsx`
- `frontend/src/components/TradeList.tsx`
- `frontend/src/components/ChartManager.tsx`
- `frontend/src/components/ReplayAnalyticsPanel.tsx`
- `frontend/src/utils/replaySession.ts`
- `frontend/src/utils/replayPlayback.ts`
- `backend/main.py`
- `backend/migrations/runner.py`
- `backend/services/trade_importer.py`

</canonical_refs>

<code_context>
## Existing Code Insights

### Already durable
- `ReplayPage.tsx` + `replaySession.ts` already persist the selected trade seed in `localStorage`.
- `ChartManager.tsx` + `replayPlayback.ts` already persist replay progress per trade.
- Import report CSV download already works end-to-end.
- Migration runner already creates SQLite backups before applying migrations.

### Memory-only gaps
- `TradeList.tsx` keeps symbol/search selection in memory only.
- `ChartManager.tsx` keeps active timeframe, compare mode/symbol/timeframe, and fullscreen in memory only.
- `ReplayAnalyticsPanel.tsx` keeps open/closed state in memory only.

### Product-safe scope
- The right panel layout now includes analytics + position details, so restoring analytics openness belongs to STAT-01.
- The import page is the safest place for backup/export UI because it already exposes report downloads and local-data lifecycle concepts.

</code_context>

<deferred>
## Deferred Ideas

- Cloud sync or remote backup
- Multi-profile workspace presets
- Full database diff/merge restore flows
- Non-SQLite export formats for replay data

</deferred>

---

*Phase: 04-local-ux-polish-performance-hardening*
*Context gathered: 2026-04-11*
