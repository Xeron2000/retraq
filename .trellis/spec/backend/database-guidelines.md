# Database Guidelines

> Database patterns and conventions for this project.

---

## Overview

<!--
Document your project's database conventions here.

Questions to answer:
- What ORM/query library do you use?
- How are migrations managed?
- What are the naming conventions for tables/columns?
- How do you handle transactions?
-->

(To be filled by the team)

---

## Query Patterns

<!-- How should queries be written? Batch operations? -->

(To be filled by the team)

---

## Migrations

- Schema bootstrap: `Base.metadata.create_all` + `migrate.ensure_database()` on app/import startup (no Alembic).
- One-shot column add: `ALTER TABLE trades ADD COLUMN profile_id` when legacy DB has rows without column.
- Legacy data → profile name **默认**; empty DB → **浪哥（示例）** + langge import of repo `1.xlsx` only to that profile.
- New trades require `profile_id` (ORM); SQLite may not enforce FK CASCADE on raw ALTER—verify delete-profile in real DB.

---

## Naming Conventions

<!-- Table names, column names, index names -->

(To be filled by the team)

---

## Common Mistakes

<!-- Database-related mistakes your team has made -->

(To be filled by the team)
