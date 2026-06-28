# Multi-profile universal replay (MVP)

## Background

Retraq today is positioned as **bit浪浪** delivery-sheet replay: a single global `trades` table, Langge Excel column map, first-run import of repo `1.xlsx`, and a Learn page tied to that persona.

Goal: **any trader's history** can be replayed on one machine via **multiple local profiles** and **file import** (Binance API deferred).

Requirements were refined via grill-me (2026-06-28). Binance API research note: REST returns **fills**, not 1:1 closed position rows like Langge Excel; MVP stays **import-only**.

## Product decisions (locked)

| # | Decision |
|---|----------|
| 1 | **C** — Local multi-profile; nullable `user_id` reserved; no auth in MVP |
| 2 | Langge template + xlsx/csv; `ImportTemplate` registry; full column-mapping wizard **phase 2** |
| 3 | **A** — No Binance API in MVP |
| 4 | Navbar profile switcher + settings CRUD; empty DB → **浪哥（示例）** + `1.xlsx`; delete profile with confirm |
| 5 | **C** — Hide Learn from main nav (route may remain) |
| 6 | **C** — Migration: existing rows → **默认** profile; empty DB → example profile + import |
| 7 | **B** — MVP template: **langge** only; Binance export template when sample file exists |

## MVP scope

### Backend

- **Schema**: `profiles` table; `trades.profile_id` FK, indexed
- **Migration**: legacy rows → **默认**; empty DB → **浪哥（示例）** + `1.xlsx`
- **API**: `/api/profiles` CRUD; trade/stats/import scoped via `X-Profile-Id`
- **Import**: `template=langge`, xlsx/xls/csv; template registry

### Frontend

- Navbar profile switcher; `/settings` for profile CRUD
- Replay/Analysis/import use active profile
- Hide Learn in main nav

### Docs / startup

- README generic positioning; `start.sh` / `import_data.py` aligned

## Out of scope (MVP)

Binance API, auth, Learn in nav, column wizard, Binance templates without samples.

## Acceptance criteria

1. Two profiles → disjoint trade lists and stats when switching.
2. Import attaches only to active profile.
3. Fresh install: **浪哥（示例）** + `1.xlsx`; user can add another profile.
4. Upgrade: legacy trades under **默认**; no duplicate xlsx import.
5. Delete profile removes trades (confirmed in UI).
6. Learn not in primary navigation.
7. Langge template still parses `1.xlsx` (timezone preserved).

## References

- `backend/services/trade_importer.py`, `backend/models.py`, `backend/main.py`

## Appendix: Binance (phase 2)

- `GET /fapi/v1/userTrades`, `GET /fapi/v1/income`; aggregation or export sheets needed for Langge-shaped rows.