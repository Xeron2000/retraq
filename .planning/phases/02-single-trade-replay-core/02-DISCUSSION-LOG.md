# Phase 2 Discussion Log

## Autonomous Discuss Outcome

### Resolved Defaults
- Replay entry precedence is `route seed > local restore > latest trade > empty state`.
- Replay uses a single shared cursor and bar-step playback model.
- Controls in scope: play, pause, step backward, step forward, reset, speed.
- Speed presets in scope: 1x, 2x, 4x.
- Persistence is browser-local only for Phase 2.

### Explicitly Deferred
- Compare semantics mismatch between code and roadmap is deferred to Phase 3.
- Keyboard shortcuts and scrubber UX are deferred.
- Backend replay-state persistence is deferred.

### Why These Defaults
- They extend the existing replay shell without forcing a rewrite.
- They satisfy `REPL-01..04` and `STAT-02` with minimal backend risk.
- They keep Phase 2 focused on single-trade replay rather than compare redesign.

---

Approved for planning on 2026-04-11 after worktree-based Phase 1 approval.
