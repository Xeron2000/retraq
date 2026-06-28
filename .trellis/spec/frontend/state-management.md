# State Management

> How state is managed in this project.

---

## Overview

- **Active profile**: `ProfileContext` + `localStorage` key `retraq.activeProfileId`.
- All trade/stats/import API calls must send header **`X-Profile-Id`** (see `frontend/src/services/api.ts` axios interceptor).
- Components that load trades or stats should refetch when `activeProfileId` changes (set loading while switching).

---

## State Categories

<!-- Local state, global state, server state, URL state -->

(To be filled by the team)

---

## When to Use Global State

<!-- Criteria for promoting state to global -->

(To be filled by the team)

---

## Server State

<!-- How server data is cached and synchronized -->

(To be filled by the team)

---

## Common Mistakes

<!-- State management mistakes your team has made -->

(To be filled by the team)
