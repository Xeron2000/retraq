# Phase 3 Discussion Log

## Autonomous Discuss Outcome

### User Clarification
- Phase 3 compare is not either/or.
- Both of these must be delivered in this phase:
  1. 同一交易对，多时间周期对比
  2. 同一时间周期，多交易对对比

### Locked Defaults
- Use one main chart plus one secondary compare pane.
- Secondary pane switches meaning by explicit mode instead of multiplying chart count.
- Replay shell remains chart-first; analytics stay supportive and collapsible.
- No backend schema changes are assumed for this phase.

### Architecture Recommendation Adopted
- Keep `ReplayPage` as the replay/session owner.
- Evolve `ChartManager` into a mode-aware compare orchestrator.
- Add a small replay analytics panel rather than reusing the full `AnalysisPage` surface.

---

Approved for planning on 2026-04-11 after user confirmed both compare modes belong in Phase 3.
