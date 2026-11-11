---
name: report-epic-status
description: >-
  Use when reporting to the user — a routine status update, a PR on a tracked
  epic merging, or the user asking where an epic stands ("epic status", "where
  are we on #<n>?", "what's left"). Covers the message budget, what never goes
  in a report, and the one-table epic status format.
---

# Report status to the user

## Reporting to the user

**Default shape of a chat message: the outcome first, then at most a handful of
lines.** Roughly 8 lines of prose is the budget for a routine status update; a
genuinely complex decision can run longer, but it has to earn every line past
that. The progress table the user asks for after each unit of work is exempt —
it is the requested format, not prose.

**Six things bloat these messages. None of them are information the user
lacks:**

- **Restating a subagent's report.** The orchestrator's job is the
  _conclusion_ — "#2987 landed, service green" — not a prose retelling of what
  the agent said it did.
- **Verification statistics.** "135 files / 730 tests, type-check green across
  all 11 tasks" is one word to the reader: green. Give numbers only when
  something failed, or when the user asked for them.
- **Narrating abandoned paths and internal reasoning.** Work the user never
  sees and cannot act on. Report the state that exists now.
- **Self-assessment and blame attribution.** "That came from my dispatch",
  "that's the right behaviour" — the user needs the decision, not a review of
  how it arose.
- **Repeating unchanged state.** Board status, epic counts and remaining
  sub-issue lists get one mention when they _change_.
- **Bundling an unrelated ask into a status update.** A stray "also, should I
  delete this label?" buried under a report gets missed or derails the thread.
  Hold it, or ask it on its own.

### Reporting epic status

**One format answers both triggers** — a PR on a tracked epic merging, and the
user asking where an epic stands ("epic status", "where are we on #2943?",
"what's left"). Same table either way; the opening sentence names the merge
when there was one and is dropped when there wasn't.

**The report is exactly:** that sentence, then **one table** carrying every
open ticket in the epic, grouped into three lanes by a band row. Nothing else —
no board recap, no verification statistics, no retelling of the `board-keeper`
report. Before answering a status question, dispatch `board-keeper` first
(`open-pull-request` "Board reconciliation") so the table is built from a reconciled board.

```
#2975 merged — the home page can now open with a heading instead of a hero.

| #                    | What                                | Scope                  | Note                         |
| -------------------- | ----------------------------------- | ---------------------- | ---------------------------- |
| 🟢 **Done**          |                                     |                        |                              |
| 2975                 | home page — headingSettings         | web                    | merged in #3001              |
| 🟡 **Parallel now**  |                                     |                        |                              |
| 2976                 | landing page                        | web                    | `landing-page-view`          |
| 2977                 | blog list page                      | web                    | `blog-list-page`             |
| 2960                 | retire `blog_post`                  | studio                 | + seed migration             |
| 🔵 **Next, in order**|                                     |                        |                              |
| 2969                 | retire `BlogPageTemplate` props     | web                    | ⛓ stack on 2977              |
| 2988                 | rename `sectionHeader`              | studio + service + web | sequential — reds type-check |
```

**Mark a 🔵 row `⛓ stack on <#>` when it can ride a `gh stack` on the row above
it.** Dependency alone does not make a chain stackable: the **bottom** PR must
be green on `main` alone (`open-pull-request` "PR conventions" → "Stacked PRs"), so 2988 above — a rename that reds
`type-check` until every consumer lands — is unmarked. A `⛓` is a compile
claim, and an offer to the user, not a plan: marked or not, a 🔵 row ships
sequentially unless the user says to stack it.

**Lane order is fixed: 🟢 done, 🟡 parallel now, 🔵 next in order** — the
actionable lane above the queue behind it, and within 🔵 a blocker above what it
blocks. **The `Scope` column makes the 🟡 lane checkable:** tickets scoped `web`
are parallel-safe only as separate files, so a 🟡 lane whose rows share a scope
_and_ a file is a bug in the report. **Every dependency claim is derived** from
what the tickets touch — a shared file, a renamed symbol, a consumed type — never
from issue-number order; when unclear, say they are unordered, because a wrong
"blocks" sends a parallel dispatch into a collision.

**The three markers are the colour — never substitute other emoji.** Terminal
markdown renders no colour, ANSI escapes or HTML, so a band row is a normal row
with its label in the first cell and the rest empty (`<td colspan>` renders as
literal tags). Solid discs, not pictographs: a glyph like `🔜` all but vanishes
on a dark terminal, while one shape in three saturated hues reads the same on
any background.

**This table _is_ the progress table** the user asks for after each unit of
work. Regenerate it live from `gh` every time — a pasted snapshot from an
earlier turn is exactly the staleness it exists to prevent.
