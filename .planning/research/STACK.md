# Retraq 2026 Stack Recommendation

## Recommendation

Retraq should stay a local first React SPA with FastAPI, SQLite, and Lightweight Charts. For v1, the right move is to harden the current brownfield stack, not replatform it.

The standard 2026 shape for this app is a narrow, durable stack with strong schema discipline and a small amount of client side state management, not a bigger framework or a service split.

## Keep from the current stack

1. `React 19 + TypeScript + Vite + React Router`

This is still the right front end shape for a personal replay tool. The app is interactive, mostly client rendered, and browser based. React docs still support SPA style apps, and React Router v7 already fits the Vite path. Do not move to Next.js, TanStack Start, or another server heavy React framework for v1.

2. `Tailwind CSS v4 + DaisyUI`

This is a good enough UI layer for a local tool. Tailwind v4’s current Vite path is CSS first and already matches the repo direction. Keep the styling stack stable and avoid a redesign of the component system while replay quality is still the main product problem.

3. `FastAPI + SQLAlchemy 2 + Uvicorn`

This is the right backend shape for a local monolith. FastAPI remains a good fit for small typed APIs, and SQLAlchemy 2 gives enough control for query shape and future schema work. Keep the backend simple and add stricter request and response models only where the contract is painful.

4. `SQLite`

SQLite is still the correct primary store for this product. The app is personal, local, and small enough that the operational cost of Postgres would buy very little right now. The real requirement is schema discipline, not a different database brand.

5. `Lightweight Charts`

Keep it. It is client side, fast, and good for candlestick replay. Use it as the replay surface, not as a general charting platform. For replay and multi timeframe review, this is a better fit than a heavier chart stack.

6. `pandas + openpyxl + CCXT`

Keep `pandas` and `openpyxl` for Excel import. Keep `CCXT` as a market data fill layer only. The source of truth for v1 should remain imported trade history, with exchange data acting as cache and context, not as the core product dependency.

## Add soon, but do not replatform around it

1. `Alembic`

This is the main backend gap. `backend/main.py` currently calls `Base.metadata.create_all(...)` at startup, which is fine for a toy app but not for a schema that will keep changing. Alembic is the standard upgrade path, and SQLite batch migrations are the right way to handle future table changes.

2. `TanStack Query`

This is the best near term front end addition. It will help with trade list pagination, kline cache windows, and replay state refresh without turning components into fetch logic soup. Keep Axios or swap later, but add a proper server state layer soon.

3. SQLite connection guardrails

Enable `PRAGMA foreign_keys = ON`, use a sensible `busy_timeout`, and consider WAL if imports and reads start colliding. This is cheap insurance for a local app that may import while the user is browsing replay state.

4. Small test stack, once the schema settles

Add `pytest` for backend paths and `Vitest` or `Playwright` for a thin replay smoke path only after the data model is versioned. Testing matters here, but it should follow the schema boundary, not lead it.

## Avoid changing now

1. `Next.js` or any full stack React rewrite

The app does not need server components, SSR, or route level data orchestration yet. The current problem is replay fidelity, not rendering strategy.

2. `Electron` or `Tauri`

The app already has a local browser based workflow and a Python backend. A desktop shell would add packaging work without improving replay accuracy.

3. `Postgres`, remote sync, or a broker first source of truth

Manual import is still the correct v1 input. Move to sync only after replay and import quality feel boringly reliable.

4. Microservices, queues, or background infrastructure

There is not enough workload here to justify service split. Keep the monolith and harden the data boundaries first.

5. A different charting library

Do not swap chart engines while replay logic is still evolving. The value is in correct trade alignment and time window control, not in more chart features.

6. Broad front end state management rewrite

Do not introduce Redux or a similar global rewrite. Add a small query layer first, then only add local state tools if replay state still becomes tangled.

## Where the current repo is already aligned

1. `frontend/package.json` already sits on React 19, TypeScript, Vite 7, React Router 7, Tailwind v4, and Lightweight Charts. That is the right base for this product.

2. `backend/pyproject.toml` already uses FastAPI, SQLAlchemy 2, SQLite, `pandas`, and `openpyxl`. That matches the import first, local first product direction.

3. `README.md` and `.planning/PROJECT.md` both reinforce the correct product scope, local use, Excel or manual import, and replay first priority.

4. `frontend/src/components/ChartManager.tsx` and the replay page already reflect the core product shape, which is a trade centered review surface, not a generic dashboard.

5. `pnpm` and `uv` are the right package managers for this repo. Keep them.

## Where the repo is misaligned

1. `backend/main.py` still uses `Base.metadata.create_all(...)` on startup. That is the biggest technical gap because it blocks safe schema evolution.

2. The backend has no visible migration layer yet. That is the first stack level improvement to make before adding more tables or replay metadata.

3. The SQLite connection behavior is not yet shaped around durability. Foreign keys, busy handling, and write concurrency should be made explicit.

4. The front end still carries a few large, imperative components. This is not a reason to replatform, but it is a reason to split replay logic from fetch logic and marker rendering.

5. The current test and type checking story is too thin for a product whose main job is data alignment. That is a quality gap, not a stack rewrite trigger.

6. `allow_origins=["*"]` in `backend/main.py` is acceptable for local use, but it is another sign that the backend is still tuned for a personal machine, not for any public exposure.

## Roadmap shape this stack suggests

1. First, lock down schema evolution with Alembic and a stable import contract.

2. Second, add a proper server state layer with TanStack Query so replay and kline loading stop leaking into component logic.

3. Third, tighten SQLite pragmas and indexes, then keep replay state and chart state in smaller modules.

4. Only after the replay path feels solid should the project consider heavier analytics storage, sync, or a desktop shell.

## Confidence notes

1. High confidence. Keep the current core stack. The product constraints are local, personal, and import first, so there is no strong reason to replatform.

2. High confidence. Add Alembic soon. The current `create_all` approach is the clearest brownfield risk in the repo.

3. Medium confidence. Add TanStack Query soon. It is a good fit for the replay and kline fetch patterns, but it should stay lightweight.

4. Low confidence. Consider DuckDB or a desktop wrapper only if data volume, offline search, or OS level integration becomes a real requirement later.

## Sources used

1. React docs, `https://react.dev/learn/start-a-new-react-project`
2. Tailwind CSS docs, `https://tailwindcss.com/docs/installation/using-vite`
3. FastAPI docs, `https://fastapi.tiangolo.com/tutorial/sql-databases/`
4. Alembic docs, `https://alembic.sqlalchemy.org/en/latest/tutorial.html`
5. Alembic SQLite batch migration docs, `https://alembic.sqlalchemy.org/en/latest/batch.html`
6. SQLite foreign key docs, `https://www.sqlite.org/foreignkeys.html`
7. SQLite pragma docs, `https://www.sqlite.org/pragma.html#pragma_journal_mode`
8. Lightweight Charts docs, `https://tradingview.github.io/lightweight-charts/docs`
9. TanStack Query docs, `https://tanstack.com/query/latest/docs/framework/react/overview`
