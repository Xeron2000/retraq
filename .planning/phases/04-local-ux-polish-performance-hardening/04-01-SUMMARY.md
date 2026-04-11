# 04-01 Summary

## Changed files
- `frontend/src/utils/replayWorkspace.ts`
- `frontend/src/pages/ReplayPage.tsx`
- `frontend/src/components/TradeList.tsx`
- `frontend/src/test/replayWorkspace.test.ts`
- `frontend/src/test/replayPage.test.tsx`
- `frontend/src/test/tradeListSelection.test.tsx`
- `frontend/src/test/setup.ts`
- `frontend/vitest.config.ts`
- `frontend/package.json`
- `frontend/pnpm-lock.yaml`

## Verification
- `cd frontend && pnpm exec vitest run src/test/replayWorkspace.test.ts src/test/replayPage.test.tsx src/test/tradeListSelection.test.tsx` → 11 passed
- `cd frontend && pnpm build` → success
- `lsp_diagnostics` on changed TS/TSX files → clean

## Decisions
- Added a dedicated replay workspace store for filter bootstrap without changing replay session/progress ownership.
- Kept precedence as `route seed > replay session > workspace filter bootstrap > latest trade default`.
- Prevented TradeList’s default BTC/latest-trade path from overriding a restored workspace symbol.
