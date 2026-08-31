# Refactor sweep log

> Part of the docs split described in [`docs/README.md`](../README.md).

Tracking log for the `refactor-sweep` skill (`.claude/skills/refactor-sweep/SKILL.md`).
One row per layer agent. The skill reads this table to pick which layer is
most overdue, and updates the row it just swept — this file is the source of
truth for "when did we last look at `<layer>`," not memory or guesswork.

Rotation order (top to bottom) is the order a layer gets its first sweep when
multiple rows tie on "never swept." After that, whichever row has the oldest
`Last swept` date goes next.

| Layer        | Last swept | Commit swept | Findings | Issues filed                      |
| ------------ | ---------- | ------------ | -------- | --------------------------------- |
| config       | never      | —            | —        | —                                 |
| studio       | 2026-08-30 | 9e2a5c76     | 1        | #2332                             |
| service      | 2026-08-31 | ff2e94f7     | 3        | #2371, #2372, #2373               |
| ui           | 2026-08-30 | 8e49f9a8     | 3        | #2340, #2341, #2342               |
| web          | 2026-08-30 | 8e49f9a8     | 3        | #2337, #2338, #2339               |
| db           | 2026-08-30 | 9e2a5c76     | 5        | #2326, #2328, #2329, #2333, #2334 |
| auth         | 2026-08-31 | ff2e94f7     | 2        | #2376, #2377                      |
| platform-app | 2026-08-30 | 9e2a5c76     | 2        | #2330, #2331                      |
| insight      | 2026-08-31 | ff2e94f7     | 1        | #2378                             |

**Commit swept** is the `main` SHA the audit read at (short form), so a
future sweep can diff from there if useful context for what's new since.
