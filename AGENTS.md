# AGENTS

<skills_system priority="1">

## Available Skills

<!-- SKILLS_TABLE_START -->
<usage>
When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively. Skills provide specialized capabilities and domain knowledge.

How to use skills:
- Invoke: Bash("openskills read <skill-name>")
- The skill content will load with detailed instructions on how to complete the task
- Base directory provided in output for resolving bundled resources (references/, scripts/, assets/)

Usage notes:
- Only use skills listed in <available_skills> below
- Do not invoke a skill that is already loaded in your context
- Each skill invocation is stateless
</usage>

<available_skills>

<skill>
<name>dev-browser</name>
<description>Browser automation with persistent page state. Use when users ask to navigate websites, fill forms, take screenshots, extract web data, test web apps, or automate browser workflows. Trigger phrases include "go to [url]", "click on", "fill out the form", "take a screenshot", "scrape", "automate", "test the website", "log into", or any browser interaction request.</description>
<location>global</location>
</skill>

<skill>
<name>project-analyze</name>
<description>Multi-phase iterative project analysis with Mermaid diagrams. Generates architecture reports, design reports, method analysis reports. Use when analyzing codebases, understanding project structure, reviewing architecture, exploring design patterns, or documenting system components. Triggers on "analyze project", "architecture report", "design analysis", "code structure", "system overview".</description>
<location>global</location>
</skill>

<skill>
<name>prompt-enhancer</name>
<description>Transform vague prompts into actionable specs using intelligent analysis and session memory. Use when user input contains -e or --enhance flag.</description>
<location>global</location>
</skill>

<skill>
<name>ui-ux-pro-max</name>
<description>"UI/UX design intelligence. 50 styles, 21 palettes, 50 font pairings, 20 charts, 8 stacks (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind). Actions: plan, build, create, design, implement, review, fix, improve, optimize, enhance, refactor, check UI/UX code. Projects: website, landing page, dashboard, admin panel, e-commerce, SaaS, portfolio, blog, mobile app, .html, .tsx, .vue, .svelte. Elements: button, modal, navbar, sidebar, card, table, form, chart. Styles: glassmorphism, claymorphism, minimalism, brutalism, neumorphism, bento grid, dark mode, responsive, skeuomorphism, flat design. Topics: color palette, accessibility, animation, layout, typography, font pairing, spacing, hover, shadow, gradient."</description>
<location>global</location>
</skill>

<skill>
<name>webapp-testing</name>
<description>Toolkit for interacting with and testing local web applications using Playwright. Supports verifying frontend functionality, debugging UI behavior, capturing browser screenshots, and viewing browser logs.</description>
<location>global</location>
</skill>

</available_skills>
<!-- SKILLS_TABLE_END -->

</skills_system>

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Retraq**

Retraq 是一个面向我自己本地使用的加密货币交易复盘工具，用来把历史交易记录和对应行情对齐后做快速回看。当前仓库已经有前后端 MVP，但接下来的项目方向会收敛到一条更明确的主线：以 Excel / 手动导入为主，把单笔交易复盘体验做到顺手、可靠、可重复。

**Core Value:** 导入一笔历史交易后，能够快速把它和对应 K 线、买卖点、时间区间对齐，并顺畅完成一次高质量复盘。

### Constraints

- **Tech stack**: 继续沿用当前 React + TypeScript + Vite 前端，以及 FastAPI + SQLAlchemy + SQLite 后端 — 这是现有代码和运行脚本已经建立的基础
- **Data entry**: v1 以 Excel / 手动导入为主 — 这是当前用户目标和现有仓库能力的交集
- **Runtime model**: 本地运行优先，不按公网服务设计 — README 已明确不建议直接暴露到公网
- **Market data dependency**: K 线数据依赖外部交易所接口（当前实现通过 CCXT / OKX 等） — 这决定了市场数据可用性与历史覆盖范围受外部服务约束
- **Product scope**: 复盘体验优先于自动同步、教育内容和多用户能力 — 这是当前项目的核心取舍
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## 运行时 / 包管理
- Python 3.11+（`backend/pyproject.toml`, `README.md`）
- Node.js 18+、pnpm、uv（`README.md`, `start.sh`, `start.bat`）
- 前后端独立管理：后端锁文件 `backend/uv.lock`，前端锁文件 `frontend/pnpm-lock.yaml`；仓库根目录未见独立 `package.json` / workspace 文件（当前扫描结果）
## 后端
- FastAPI + Uvicorn + SQLAlchemy 2 + CCXT + pandas + openpyxl + python-multipart + pytz（`backend/pyproject.toml`）
- 入口：`backend/main.py`（API）和 `backend/import_data.py`（示例数据导入）
- Excel 导入链路依赖 pandas/openpyxl；上传接口依赖 multipart 表单（`backend/services/trade_importer.py`, `backend/main.py`）
## 前端
- React 19 + TypeScript + Vite 7 + React Router 7 + axios + lightweight-charts + lucide-react + Tailwind CSS v4 + DaisyUI（`frontend/package.json`, `frontend/vite.config.ts`, `frontend/src/index.css`, `frontend/src/App.tsx`）
- 构建链路：`tsc -b && vite build`；本地预览：`vite preview`（`frontend/package.json`, `start.sh`, `start.bat`）
## 存储
- 本地 SQLite：`sqlite:///./trading.db`（`backend/database.py`）
- 表：`klines`、`trades`；启动时自动 `Base.metadata.create_all`（`backend/models.py`, `backend/main.py`, `backend/import_data.py`）
- 索引：`klines(symbol,timeframe,timestamp)` 唯一索引，`trades(symbol)` 普通索引（`backend/models.py`）
## 本地运行假设
- 后端命令默认在 `backend/` 目录内执行，入口直接是 `uvicorn main:app`（`start.sh`, `start.bat`）
- 前端开发代理将 `/api` 转发到 `http://localhost:9527`（`frontend/vite.config.ts`）
- 启动脚本会在首次运行时导入根目录 `1.xlsx` 示例数据（`README.md`, `backend/import_data.py`）
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Repo shape
- Monorepo-style split: `frontend/` for React UI and `backend/` for FastAPI services.
- Root scripts (`start.sh`, `start.bat`) are the main cross-platform entry points.
- `README.md` documents the intended local workflow and the sample data import flow.
## Tooling choices
- Frontend package manager: `pnpm` (`frontend/pnpm-lock.yaml` is present).
- Backend environment/dependency manager: `uv` (`backend/uv.lock`, `README.md`, and `start.sh` use `uv sync`).
- Backend packaging: `backend/pyproject.toml` uses `hatchling` as the build backend.
- Frontend build stack: React 19 + TypeScript + Vite + TailwindCSS + DaisyUI + Lightweight Charts.
- Backend stack: FastAPI + SQLAlchemy + SQLite + CCXT (OKX integration noted in `README.md`).
## Frontend coding conventions
- Components and pages use PascalCase file names under `src/components/` and `src/pages/`.
- Non-UI modules use camelCase file names under `src/services/` and `src/utils/`.
- Layout is organized by responsibility: `components/`, `pages/`, `services/`, `utils/`.
- `src/services/api.ts` centralizes API access and shared types.
- `src/utils/tradeAnalysis.ts` keeps analysis logic pure and separate from UI.
- Styling is utility-first; `src/index.css` uses Tailwind v4 CSS-first theme tokens and DaisyUI classes.
## Backend coding conventions
- Backend code is organized by module responsibility: `main.py`, `database.py`, `models.py`, and `services/`.
- Service modules separate importer, analysis, symbol, and kline concerns.
- The codebase follows explicit domain naming (`trade_importer`, `trade_analyzer`, `kline_service`).
- `import_data.py` is a standalone script and adjusts `sys.path`, which signals script-first local execution.
## Observed consistency
- Strong separation between UI, API, and pure logic helpers.
- Strict TypeScript settings are used in the frontend configs.
- Root docs and startup scripts consistently describe a local-first workflow.
## Observed inconsistencies / quality gaps
- `frontend/tailwind.config.js` still uses CommonJS while the rest of the frontend is moving toward CSS-first Tailwind v4 configuration.
- Lint coverage is incomplete: `frontend/eslint.config.js` is present, but it is not type-aware.
- The frontend has several larger, more imperative components (`ChartManager.tsx`, `AnalysisPage.tsx`) compared with the otherwise modular structure.
- There is no visible automated test harness in the inspected files.
- Current diagnostics are not clean: frontend shows Biome lint findings, and backend shows BasedPyright import/type issues.
- Backend engineering constraints stay lightweight: no visible migration tool, no visible lint/test config, and `main.py` / `import_data.py` perform `create_all` at runtime.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## 1. 系统边界
- 前端：React SPA，入口是 `frontend/src/main.tsx:1-13`，路由壳在 `frontend/src/App.tsx:7-18`
- 后端：FastAPI 服务，入口是 `backend/main.py:17-129`
## 2. 后端：数据与计算边界
- `GET /api/klines/{symbol}/{timeframe}`：返回 K 线数据
- `POST /api/trades/import`：上传 Excel 交易单并入库
- `GET /api/trades`：分页返回交易记录
- `GET /api/stats/overview`：返回汇总统计
### 2.1 数据模型
- `Kline`：行情缓存表，按 `symbol + timeframe + timestamp` 做唯一索引
- `Trade`：复盘交易表，保存方向、杠杆、开平仓价格、盈亏、收益率、时间戳等字段
### 2.2 服务层职责
- `backend/services/kline_service.py:18-306`：行情获取与缓存层。它按时间范围查 SQLite，缺口再用 `ccxt` 从外部交易所回填，随后 upsert 到 `Kline` 表。
- `backend/services/trade_importer.py:21-100`：Excel 导入层。它把中文表头映射到 `Trade` 字段，做方向、币对、时间戳等清洗后写库。
- `backend/services/trade_analyzer.py:7-75`：后端汇总统计层。它从 `Trade` 计算总盈亏、胜率、盈亏比、回撤、平均持仓时长和币对分布。
- `backend/services/symbol_utils.py:6-31`：币对规范化与校验层，保证查询和导入使用统一格式。
### 2.3 外部数据源
## 3. 前端：路由与视图编排边界
- `frontend/src/main.tsx:1-13` 负责挂载 React 和 `BrowserRouter`
- `frontend/src/App.tsx:7-18` 定义三个页面路由：`/replay`、`/analysis`、`/learn`
- `frontend/src/components/Navbar.tsx:4-64` 提供全局导航壳
### 3.1 复盘页
- `TradeList`：左侧交易列表与交易对筛选
- `ChartManager`：中间 K 线与对比图
- `PositionDetails`：右侧仓位详情
### 3.2 分析页
- 时间分析
- 行为分析
- 风险分析
- 币对分析
### 3.3 学习页
### 3.4 传输边界
- `fetchKlines()`：请求 `/api/klines/...`，把后端毫秒时间戳转换成轻量图表使用的秒级时间
- `fetchTrades()`：分页拉取 `/api/trades`
- `importTrades()`：上传 Excel 到 `/api/trades/import`
- `fetchStats()`：读取 `/api/stats/overview`
## 4. 数据流：从源头到 UI
## 5. 心智模型
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
