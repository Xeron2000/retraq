# Codebase Conventions

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
