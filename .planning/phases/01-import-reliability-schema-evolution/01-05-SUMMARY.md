# 01-05 Summary

## Changed files
- `backend/main.py`
- `backend/import_data.py`
- `backend/tests/test_startup_migrations.py`
- `frontend/src/test/import-route-smoke.test.tsx`
- `backend/services/trade_importer.py`
- `backend/tests/test_import_api.py`
- `frontend/src/services/importReportAdapter.ts`
- `frontend/src/test/import-api.contract.test.ts`

## Verification
- `cd backend && uv run pytest tests/test_startup_migrations.py -q` → 2 passed
- `cd backend && uv run pytest tests/test_import_contracts.py tests/test_migration_runner.py tests/test_trade_importer.py tests/test_import_api.py tests/test_startup_migrations.py -q` → 15 passed
- `cd frontend && pnpm exec vitest run src/test/import-route-smoke.test.tsx` → 2 passed
- `cd frontend && pnpm exec vitest run src/test/import-api.contract.test.ts src/test/ImportPage.test.tsx src/test/import-route-smoke.test.tsx` → 11 passed
- `cd frontend && pnpm build` → success
- Live API verification against running app:
  - valid import returns structured summary + download reference
  - re-import keeps trade count unchanged and reports duplicates/conflicts
  - invalid workbook returns file-level rejection details
  - CSV download returns row-level repair data

## Decisions
- Wired `MigrationRunner(engine=engine).run()` into runtime entry points before schema bootstrap so backup-first migration happens before normal app/database access.
- Added route-level smoke coverage without broadening frontend routing behavior beyond the existing `/import` integration already present in the worktree.
- Fixed a live-only `NaN` serialization bug by normalizing missing scalar values in failed row outcomes and added regression coverage for blank required cells.
- Made the frontend import adapter accept the actual backend Phase 1 dataclass JSON shape (`*_count`, `file_rejection`, `download_reference`, `outcome`) so live API responses map cleanly into the UI contract.

## Approval Gate
- Automated verification is complete.
- Manual/runtime verification is complete from the assistant side.
- Phase closure is pending explicit user approval or reported issues.
