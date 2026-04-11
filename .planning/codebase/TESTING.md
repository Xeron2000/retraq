# Testing

## Current state
- No dedicated automated test suite was observed in the inspected repo files.
- Frontend `package.json` exposes `dev`, `build`, `lint`, and `preview` only.
- Backend startup is script-driven, but no test command was visible in the inspected files.
- `backend/pyproject.toml` did not show pytest/coverage/lint configuration in the inspected scan.

## Existing validation commands
- `./start.sh` (Linux/macOS) / `start.bat` (Windows): full local startup path.
- Frontend: `pnpm lint` and `pnpm build`.
- Backend: `uv sync`, `uv run python import_data.py`, `uv run uvicorn main:app --reload --port 9527`.

## What `pnpm build` covers
- The frontend build command runs TypeScript project build checks before Vite build (`tsc -b && vite build` in `frontend/package.json`).

## Diagnostics baseline
- `frontend/src` currently reports 40 lint diagnostics, mostly hook dependencies, array-index keys, SVG title accessibility, and explicit button type issues.
- `backend` currently reports 31 BasedPyright diagnostics, mostly unresolved imports plus type-annotation / optionality issues.

## Notable gaps
- No `test` script in the frontend package manifest.
- No visible `pytest`/`unittest`/`vitest`/`playwright` setup in the inspected files.
- No evidence of CI validation commands in the inspected files.
- Current baseline is not clean: frontend diagnostics still report lint issues, and backend diagnostics still report unresolved imports plus type issues.
