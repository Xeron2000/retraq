# Implementation plan

## Order (suggested)

1. **Backend models + migrate** — `Profile`, `Trade.profile_id`, startup migration
2. **Profiles API** — CRUD in `main.py`
3. **Scope trades/stats/import** — require `X-Profile-Id`; update `trade_analyzer`
4. **TradeImporter** — `profile_id`, `template_id`, csv
5. **import_data.py / start.sh** — empty vs legacy rules
6. **Frontend ProfileContext + api client** — header on all trade calls
7. **Navbar + Settings UI**
8. **Import UI template dropdown**
9. **Hide Learn nav**; README update
10. **Manual smoke**: two profiles, import, switch, delete

## Files likely touched

- `backend/models.py`, `backend/database.py`, `backend/main.py`
- `backend/services/trade_importer.py`, `backend/services/trade_analyzer.py`
- `backend/import_data.py`
- `frontend/src/services/api.ts`, `frontend/src/components/Navbar.tsx`
- New: `frontend/src/context/ProfileContext.tsx`, `frontend/src/pages/SettingsPage.tsx`
- `README.md`, `start.sh`

## Verification

- `uv run` backend tests if any; manual AC from `prd.md`