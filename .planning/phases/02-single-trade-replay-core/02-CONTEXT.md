# Phase 2: Single-Trade Replay Core - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

在现有 replay 壳基础上，把“选中一笔交易后进入可控回放”补完整：用户能从交易列表或已保存进度进入单笔 replay，会话会自动对齐 symbol / 时间窗 / 默认 timeframe，并具备 play、pause、step、speed 与本地恢复能力。

</domain>

<decisions>
## Implementation Decisions

### Replay 入口与状态优先级
- **D-02-01:** Phase 2 的 replay 入口优先级固定为：`route seed > local restore > latest trade > empty state`。
- **D-02-02:** `/replay` 继续作为唯一 canonical route；Phase 2 不新增独立 replay detail route。
- **D-02-03:** `TradeList` 的“自动打开最近一笔”只在没有 route/local seed 时生效。

### Playback 模型
- **D-02-04:** Replay 采用**单共享 cursor 的 bar-step 模型**，而不是时间连续动画或多 cursor 模型。
- **D-02-05:** Phase 2 控制面固定包含：`play / pause / step backward / step forward / reset / speed`。
- **D-02-06:** Phase 2 速度档位固定为 `1x / 2x / 4x`，速度只影响自动推进 cadence，不改变 step 粒度。

### 持久化边界
- **D-02-07:** Replay 进度只做**浏览器本地持久化**；Phase 2 不引入后端 replay-state schema。
- **D-02-08:** 本地保存内容限定为：selected trade seed、cursor/progress、speed、必要的 replay shell state；不保存瞬时 UI 噪声。

### 与现有 compare shell 的关系
- **D-02-09:** Phase 2 **不重定义 compare 语义**；现有 compare chart 只要求在 replay cursor 变化时不被破坏。
- **D-02-10:** “同 symbol 多 timeframe 对比” 的产品语义冲突推迟到 Phase 3 解决；Phase 2 只保证 compare shell 与 replay core 协同存在。

</decisions>

<canonical_refs>
## Canonical References

### Product scope and requirements
- `.planning/ROADMAP.md` — Phase 2 goal, success criteria, and sequencing.
- `.planning/REQUIREMENTS.md` — `REPL-01` through `REPL-04`, plus `STAT-02`.
- `.planning/STATE.md` — Approved Phase 1 baseline and current worktree source of truth.

### Current codebase reality
- `frontend/src/pages/ReplayPage.tsx` — Replay shell state owner.
- `frontend/src/components/TradeList.tsx` — Trade selection, symbol filter, and current latest-trade auto-open behavior.
- `frontend/src/components/ChartManager.tsx` — Current chart sync, markers, compare shell, and chart control surface.
- `frontend/src/components/PositionDetails.tsx` — Selected-trade detail pane.
- `frontend/src/services/api.ts` — Trade and kline data access.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ReplayPage.tsx` already owns `symbol` and `selectedTrade`, so Phase 2 should extend this page rather than introduce a parallel replay state owner.
- `TradeList.tsx` already auto-selects a latest trade for the chosen symbol, which can be gated for route/local replay seeds.
- `ChartManager.tsx` already computes `rangeForTrade`, `visibleRangeForTrade`, entry/exit markers, and shared chart synchronization, which should remain the rendering core.
- `PositionDetails.tsx` already reflects the selected trade and should stay aligned with replay session state.

### Established Patterns
- Frontend side-effects live in page/component hooks rather than global state libraries.
- Frontend contracts and adapters live under `src/services/` and pure helpers under `src/utils/`.
- Existing replay shell is chart-first, not toolbar-first; Phase 2 controls should be inserted surgically.

### Integration Points
- `fetchTrades()` and `fetchStats()` provide seed selection data for replay bootstrap.
- `fetchKlines()` already supports range-bound requests and should remain the chart data ingress.
- Current compare chart shell in `ChartManager.tsx` shares visible range and crosshair with the main chart; Phase 2 playback should preserve that behavior.

</code_context>

<specifics>
## Specific Ideas

- Phase 2 should feel like completing a latent replay engine, not replacing the current chart shell.
- The smallest safe persistence unit is a versioned browser-local replay session blob.
- Marker visibility is already present; Phase 2 should preserve and regression-test it rather than redesign it.

</specifics>

<deferred>
## Deferred Ideas

- Independent compare semantics and “same-symbol multi-timeframe” product shape are deferred to Phase 3.
- Keyboard shortcuts, scrubbing timeline, and backend replay-state persistence are out of scope for Phase 2.

</deferred>

---

*Phase: 02-single-trade-replay-core*
*Context gathered: 2026-04-11*
