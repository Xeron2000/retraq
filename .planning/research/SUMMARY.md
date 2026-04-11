# Project Research Summary

**Project:** Retraq
**Domain:** 本地优先的 crypto trade replay / 复盘工具
**Researched:** 2026-04-11
**Confidence:** HIGH

## Executive Summary

Retraq is not a trading terminal or a general analytics platform; it is a personal, local-first replay tool whose core job is to make one imported trade line up cleanly with the right market window and make the review flow feel immediate. Experts would build this as a small, durable monolith: a React SPA on the client, a FastAPI + SQLite backend for facts/import/cache, and a replay-centric UI that treats the trade as the primary object and the chart as context.

The strongest recommendation across the research is to harden the current brownfield stack rather than replatform. The main risks are not missing features, but incorrect time alignment, shaky Excel import behavior, and premature complexity around sync, collaboration, or heavy analytics. The right mitigation is schema discipline, explicit import validation, a single replay orchestration path, and a strict local-first scope.

## Key Findings

### Recommended Stack

Keep the current stack. It already matches the product shape: interactive, browser-based replay on the front end; typed local APIs and SQLite on the back end; and lightweight charting for candlestick review. The immediate stack gap is migration discipline, not a new framework.

**Core technologies:**
- `React 19 + TypeScript + Vite + React Router`：适合 SPA 复盘体验，没必要在 v1 切到 Next.js 之类的重框架。
- `Tailwind CSS v4 + DaisyUI`：足够支撑本地工具 UI，先稳定交互，不要重做设计系统。
- `FastAPI + SQLAlchemy 2 + Uvicorn`：适合小而清晰的 typed API 层，继续保持单体后端。
- `SQLite`：本地个人工具的正确事实库，关键是 schema 纪律而不是换数据库。
- `Lightweight Charts`：适合作为 replay 主图，不要在 v1 换图表引擎。
- `pandas + openpyxl + CCXT`：Excel 导入和行情补齐的合理组合，CCXT 只是上下文缓存，不是主数据源。
- `Alembic`：需要尽快补上，解决 `create_all` 带来的 schema 演进风险。
- `TanStack Query`：适合 trade list、kline 窗口和 replay state 的 server state 管理。

### Expected Features

v1 的中心体验是：导入交易、快速打开单笔 trade、自动对齐到正确 K 线窗口、对比少量 timeframe、并用有限指标完成复盘。不要把产品做成通用 charting terminal。

**Must have (table stakes):**
- Excel / manual import with validation、timezone 处理、去重、行级错误。
- Trade list：搜索、symbol filter、date filter、快速进入 replay。
- Replay controls：play/pause、step、speed、resume last state。
- K-line view：正确 trade markers、entry/exit context、足够历史窗口。
- Multi-timeframe comparison：回答“higher timeframe 当时在做什么”。
- Lightweight analytics：win rate、PnL、average hold time、drawdown、symbol split。
- Local persistence：imports、replay state、layout choices。

**Should have (competitive):**
- Local-first 默认、无登录、无云同步、无协作。
- Excel first 导入流。
- Replay centered on imported trades，而不是泛化看盘。
- Multi-timeframe compare 只作为复盘辅助。
- 缺行情时有明确 gap handling。

**Defer (v2+):**
- 账号系统、权限、分享、协作。
- 云同步、远程备份、公开 SaaS 化。
- Broker auto-sync 作为 v1 source of truth。
- Live trading / paper trading / order routing / execution simulation。
- 教学、社区、leaderboard、AI mentor。
- 重 BI、策略回测、复杂告警、tick replay、order book 深度图。

### Architecture Approach

Architecturally，最合理的边界是：SQLite 保存事实数据，导入层负责清洗和归一化，行情层负责缓存与补齐，前端负责 replay 编排和轻量分析。Replay 应该收敛成一个会话控制器，而不是散落在多个组件里的状态拼图。

**Major components:**
1. `事实层` — 只保留 `trades` 和 `klines`，其他都当派生数据。
2. `导入层` — Intake / Validate / Normalize 三步，坏行先进入报告或失败列表。
3. `行情层` — 先查本地缓存，缺口再回源，再回填落库。
4. `Replay 编排层` — Trade selector、Window resolver、Chart coordinator、Replay state 四个职责。
5. `分析层` — 前端先算轻量指标，重聚合再考虑后端化。

### Critical Pitfalls

1. **交易时间和 K 线边界错位** — 保留原始时间戳、标准化时间戳和显示时区，统一边界规则，并对分钟级/跨日样本做回归。
2. **时区和夏令时漂移** — 数据库只认 UTC，展示层单独做转换，固定 DST/跨午夜测试。
3. **多周期同步看起来对，实际上不一致** — 统一时间轴，所有周期从同一份原始行情派生，避免 feedback loop。
4. **Excel 导入链路太脆** — 先预览再写入，行级报错、原始摘要、可重复导入与排错。
5. **SQLite / 自动建表吃掉历史兼容性** — 尽早上 Alembic，版本化 schema，不要让旧库靠运气运行。

## Implications for Roadmap

### Phase 1: Import Reliability + Schema Evolution
**Rationale:** 先把数据入口和数据库演进稳定住，否则后面所有 replay 和分析都会建立在不可信的事实层上。
**Delivers:** Excel/manual import 预览、行级校验、去重、UTC 标准化、导入报告、Alembic migrations。
**Addresses:** import validation、timezone handling、duplicate handling、local persistence。
**Avoids:** Excel 导入脆弱、时区漂移、SQLite 历史兼容性丢失。

### Phase 2: Single-Trade Replay Core
**Rationale:** 这是产品主价值，必须先把“打开一笔单子并对齐到正确窗口”做稳。
**Delivers:** trade selector、window resolver、单笔打开路径、replay state、trade markers、resume last state。
**Uses:** FastAPI + SQLite facts、Lightweight Charts、Chart coordinator。
**Implements:** replay 编排层。
**Avoids:** 交易时间/K 线边界错位、图表状态失控。

### Phase 3: Multi-Timeframe Compare + Lightweight Analytics
**Rationale:** 在单笔 replay 稳定后，再增加辅助视角和描述性指标，避免把复杂度提前塞进主流程。
**Delivers:** 多周期对比、crosshair/visible range 同步、win rate/PnL/hold time/drawdown/symbol split。
**Uses:** TanStack Query、前端本地计算、缓存化派生数据。
**Implements:** chart coordinator + analysis layer。
**Avoids:** 多周期看似同步但实际不一致、指标“太漂亮”误导用户。

### Phase 4: Performance Hardening + Local UX Polish
**Rationale:** 当 replay 主链路可靠后，再处理量增带来的卡顿和细节磨损。
**Delivers:** 计算缓存、查询分层、局部重绘控制、导入后快速回到列表、布局记忆与细节 polish。
**Uses:** SQLite pragmas / indexes、前端 store 轻量化。
**Implements:** 本地存储与缓存边界。
**Avoids:** 本地分析过重、页面变慢、过度状态管理。

### Phase Ordering Rationale

- 先做导入和 schema，因为事实层不稳，后面的 replay 再好看也不可信。
- 先做单笔 replay，再做多周期和分析，因为产品的中心价值是“看懂这笔单子”。
- 把 chart sync 和 replay state 收进单一协调器，避免组件之间互相监听造成反馈环。
- 明确推迟 sync、协作、云化和重 BI，避免早期被平台化复杂度拖偏。

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** chart synchronization edge cases、Lightweight Charts replay/window behavior、边界对齐规则。
- **Phase 3:** multi-timeframe aggregation consistency、指标口径与样本展示。

Phases with standard patterns (skip research-phase):
- **Phase 1:** Alembic migration、SQLite batch migration、导入校验与行级报错。
- **Phase 4:** performance hardening、local state refinement。

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | 研究文件和现有 repo 都一致指向同一套本地单体栈，且 brownfield 方向明确。 |
| Features | HIGH | v1 范围收敛清晰：导入、单笔 replay、多周期辅助、轻量分析。 |
| Architecture | HIGH | 组件边界、数据流和职责划分在三份研究里高度一致。 |
| Pitfalls | HIGH | 主要风险集中在对齐、导入、时区、同步和迁移，识别明确。 |

**Overall confidence:** HIGH

### Gaps to Address

- **Replay 对齐规则的最终口径**：在 Phase 2 规划时明确按开盘、收盘还是最近 bar 对齐，并用边界样本验证。
- **多周期数据来源细节**：在 Phase 3 规划时确认原始行情的聚合与缺口提示策略，避免“看起来同步”的假一致。
- **性能阈值**：在 Phase 4 规划时用实际交易量定义前端计算和重绘的阈值，而不是凭感觉优化。

## Sources

### Primary (HIGH confidence)
- `.planning/research/STACK.md` — stack recommendation、current repo alignment、roadmap shape
- `.planning/research/FEATURES.md` — table stakes、differentiators、anti-features
- `.planning/research/ARCHITECTURE.md` — component boundaries、data flow、sync model
- `.planning/research/PITFALLS.md` — alignment/timezone/import/migration/performance risks

### Secondary (MEDIUM confidence)
- `README.md` — product scope and local-first positioning already consistent with research

---
*Research completed: 2026-04-11*
*Ready for roadmap: yes*
