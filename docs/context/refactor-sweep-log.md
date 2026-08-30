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
| service      | never      | —            | —        | —                                 |
| ui           | never      | —            | —        | —                                 |
| web          | never      | —            | —        | —                                 |
| db           | 2026-08-30 | 9e2a5c76     | 5        | #2326, #2328, #2329, #2333, #2334 |
| auth         | never      | —            | —        | —                                 |
| platform-app | 2026-08-30 | 9e2a5c76     | 2        | #2330, #2331                      |
| insight      | never      | —            | —        | —                                 |

**Commit swept** is the `main` SHA the audit read at (short form), so a
future sweep can diff from there if useful context for what's new since.
