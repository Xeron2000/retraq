# 01-01 Summary

## Changed files
- `backend/pyproject.toml`
- `backend/uv.lock`
- `backend/tests/conftest.py`
- `backend/tests/test_import_contracts.py`
- `backend/tests/test_migration_runner.py`
- `backend/services/import_types.py`
- `backend/migrations/__init__.py`
- `backend/migrations/runner.py`

## Verification
- `cd backend && uv lock`
- `cd backend && uv sync`
- `cd backend && uv run pytest tests/test_import_contracts.py -q` → 4 passed
- `cd backend && uv run pytest tests/test_migration_runner.py -q` → 3 passed
- `cd backend && uv run pytest tests/test_import_contracts.py tests/test_migration_runner.py -q` → 7 passed
- `lsp_diagnostics` on all changed Python files → clean

## Decisions
- Added `pytest` directly to backend dependencies and refreshed `uv.lock` so the backend test harness is runnable in the worktree.
- Kept the import contract narrow and explicit with dataclass-based report types plus fixed outcome buckets for success, failed, duplicate, conflict, and timestamp normalization.
- Implemented the migration runner as a small SQLite-first contract with backup-before-migrate behavior and a raw SQL bootstrap migration for schema `001`, without touching runtime startup wiring.
