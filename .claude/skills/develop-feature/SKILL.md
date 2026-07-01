---
name: develop-feature
description: >-
  The end-to-end development lifecycle for this repo — how to take a task from
  request to commit: investigate, plan, delegate each layer to its scoped
  subagent, test, self-review, and commit (deploy is human-gated). Use at the
  START of any non-trivial implementation request so the right agents and skills
  run in the right order.
---

# Develop a feature (lifecycle + delegation)

This is the orchestration playbook. The per-layer agents and the other skills
know *how* to do their part; this skill says *what order* and *who does which
part*. Run it at the start of any non-trivial task.

## 0. Decide the shape
- Trivial / single-file / one layer → just do it (still test + review).
- Spans multiple layers → use the `add-content-type` recipe and delegate per
  layer as below.

## 1. Investigate + set status (main session)
- Restate the task and acceptance criteria. Read `SPEC.md` for the contracts.
- Locate the affected files/layers (Grep/Glob/Read). Identify which workspaces
  change: `cms`, `service`, `ui`, `web`.
- If the task touches a library API, CLI command, or config format you are not
  certain of, run the `use-context7` skill **before** writing the plan — fetch
  the relevant docs now, not mid-implementation.
- Surface unknowns early; ask the user only if a decision is genuinely theirs.
- **Move the GitHub Project item to "In Progress"** as soon as work begins:
  ```
  gh api graphql -f query='mutation {
    updateProjectV2ItemFieldValue(input:{
      projectId:"PVT_kwHOAIMQW84BcK3T"
      itemId:"<ITEM_ID>"
      fieldId:"PVTSSF_lAHOAIMQW84BcK3TzhW1nPs"
      value:{singleSelectOptionId:"47fc9ee4"}
    }) { projectV2Item { id } }
  }'
  ```
  Item IDs → see the Project board or query once via GraphQL (see `open-pull-request` skill for the query pattern). Status option IDs for this board: `f75ad846` Todo · `47fc9ee4` In Progress · `98236657` Done.

## 2. Plan (main session)
- Write the change as ordered steps **in dependency order**:
  `cms → types(typegen) → service → ui → web`. Never reverse it.
- Note which step each subagent owns.

## 3. Implement — delegate to the scoped subagent for each layer
Hand each layer's work to its agent (use the Agent tool, or state which agent
owns it). Do them in dependency order; later steps depend on earlier output:
| Layer / work | Agent | Skill it should apply |
|---|---|---|
| Sanity schema + `pnpm typegen` | `cms` | `add-content-type` |
| GROQ + typed fetcher | `service` | `add-content-type`, `testing-practices` |
| Components | `ui` | `ui-library-practices`, `testing-practices` |
| Routes / metadata / feeds | `web` | `seo-and-metadata`, `testing-practices` |

If you do a layer yourself instead of delegating, still apply that layer's
agent rules and skill.

## 4. Test
- Co-locate tests as you go (`testing-practices`). Then from root: `pnpm test`.
- New routes/metadata: sanity-check `sitemap`/RSS.

## 5. Verify the whole graph
- From root: `pnpm typegen` (clean) → `pnpm type-check` → `pnpm lint` →
  `pnpm test` → `pnpm build`. All must pass before committing.

## 6. Self-review
- Run the `code-review-practices` skill over `git diff`. Fix boundary/type
  issues (blocking) before anything else.

## 7. Commit + ship (only when the user asks)
- Conventional commit, one concern per commit/PR.
- For push + PR, follow the `open-pull-request` skill (push is confirm-gated).
- **When the PR is opened, move the Project item to "Done"** (same mutation as
  step 1, option id `98236657`). The merge will auto-close the issue via
  `Closes #n` in the PR body.

## 8. Deploy — human-gated, never automatic
- `sanity deploy` (cms) and Vercel deploys are **manual, human-run** steps. Do
  not run them. At most, remind the user of the commands (README → Deployment).

## Guardrails
- Respect every layer boundary (`SPEC.md`). A cross-layer feature that leaks a
  boundary is wrong even if it "works".
- Regenerate + commit `sanity.types.ts` after schema changes.
- Don't read or commit `.env*`.
