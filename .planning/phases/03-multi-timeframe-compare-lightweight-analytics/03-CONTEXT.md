# Phase 3: Multi-Timeframe Compare & Lightweight Analytics - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 要在 Phase 2 replay core 之上，同时交付两种 compare 能力：
- 同一交易对，多时间周期对比
- 同一时间周期，多交易对对比

并补上轻量 analytics，但不把 replay 变成通用 dashboard 或多图工作台。

</domain>

<decisions>
## Implementation Decisions

### Compare 模式与 UI 结构
- **D-03-01:** Phase 3 采用 **一个主图 + 一个单副图槽位** 的结构，不做矩阵式多图布局。
- **D-03-02:** 副图槽位支持两种互斥 compare mode：
  - `symbol`：同 timeframe、多交易对
  - `timeframe`：同交易对、多 timeframe
- **D-03-03:** 主图永远绑定当前 replay trade 的主 symbol 与主 timeframe；副图由显式 mode 解析。

### 状态模型
- **D-03-04:** 状态分两层：
  - `viewState`：可序列化的 compare mode / compare symbol / compare timeframe / analyticsOpen
  - `runtimeState`：chart refs、sync refs、loading/error、replay cursor runtime
- **D-03-05:** `ReplayPage.tsx` 继续只拥有 `symbol + selectedTrade`，Phase 3 不把 replay transport 全量上提。

### 标记与同步语义
- **D-03-06:** compare pane 继续与主图同步 visible range 与 crosshair。
- **D-03-07:** `timeframe` compare 模式下，副图允许显示当前 trade 的 marker / price lines。
- **D-03-08:** `symbol` compare 模式下，副图不显示当前 trade 标记，避免语义错位。
- **D-03-09:** 跨 timeframe 的 crosshair sync 不能依赖“完全相同 timestamp”，应按“包含该时刻的 bar”做映射。

### Analytics 边界
- **D-03-10:** Analytics 保持 lightweight/supportive，以 replay 内可折叠 panel 方式交付，不重用整页 `AnalysisPage.tsx` UI。
- **D-03-11:** 优先复用现有 `fetchStats()` / `fetchTrades()` 和 `tradeAnalysis.ts` 纯函数，不新增 backend schema。
- **D-03-12:** Analytics 首次展开时再加载/计算，默认关闭，避免抢占 replay 主流程。

</decisions>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/STATE.md`
- `frontend/src/components/ChartManager.tsx`
- `frontend/src/pages/ReplayPage.tsx`
- `frontend/src/pages/AnalysisPage.tsx`
- `frontend/src/utils/tradeAnalysis.ts`
- `frontend/src/services/api.ts`
- `backend/services/trade_analyzer.py`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ChartManager.tsx` already has a same-timeframe multi-symbol compare shell, visible-range sync, crosshair sync, and Phase 2 replay transport/control bar.
- `ReplayPage.tsx` already owns replay shell entry and selected trade state; it should remain the replay session container.
- `AnalysisPage.tsx` and `tradeAnalysis.ts` already contain many analytics calculations that can be selectively reused.
- `fetchStats()` already returns summary metrics and symbol distribution; `fetchTrades()` can supply richer trade-derived analytics without backend changes.

### Architectural Tension
- Current compare shell is implicitly `symbol` mode only.
- Phase 3 now requires an additional `timeframe` mode without breaking the current implementation.
- Current crosshair sync logic assumes exact timestamp matches and will not be correct for cross-timeframe compare.

</code_context>

<specifics>
## Specific Ideas

- Introduce a `resolvedPaneSpec` or equivalent compare resolver layer before data loading.
- Keep one secondary pane and swap its meaning by mode instead of adding more panes.
- Put analytics in a dedicated replay panel component rather than expanding `ChartManager.tsx` even further.

</specifics>

<deferred>
## Deferred Ideas

- Multi-pane / grid compare workbench
- Multi-symbol + multi-timeframe matrix comparisons at the same time
- Dedicated backend analytics endpoints unless current frontend derivation proves too slow

</deferred>

---

*Phase: 03-multi-timeframe-compare-lightweight-analytics*
*Context gathered: 2026-04-11*
