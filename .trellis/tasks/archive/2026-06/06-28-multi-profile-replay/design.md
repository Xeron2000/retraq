# Design: multi-profile MVP

## Profile scoping

- Header `X-Profile-Id: <int>` on trade/stats/import from frontend.
- Missing/invalid profile → **400**.
- Helper: `get_profile_id(request, db)`.

## Data model

`profiles(id, name UNIQUE, user_id NULL, created_at)`  
`trades.profile_id` NOT NULL FK ON DELETE CASCADE  
Index `(profile_id, entry_time)`.

## Migration

1. Legacy trades, no profile column → **默认**, backfill.
2. Empty DB → **浪哥（示例）**, import `1.xlsx` to that profile only.
3. Raw `ALTER TABLE` once if no Alembic.

## Import

`TEMPLATES = {"langge": COLUMN_MAP}`; `parse_file(db, path, profile_id, template_id)`.

## Frontend

`ProfileContext` + `localStorage` `retraq.activeProfileId`; Navbar `<ProfileSelect />`; `/settings`.

## Learn

Remove Navbar link; keep route.