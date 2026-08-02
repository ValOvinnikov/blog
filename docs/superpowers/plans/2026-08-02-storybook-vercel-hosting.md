# Hosted `@blog/ui` Storybook on Vercel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the code-side config and docs that let `@blog/ui`'s Storybook be hosted on Vercel with PR previews, so reviewers can see component changes before merge (issue #339).

**Architecture:** A new Vercel project (`blog-storybook`, human-gated console setup — not part of this plan) with Git integration and PR previews **enabled** (the deliberate exception to this repo's usual CI-gated, no-preview pattern), Root Directory `packages/ui`. All build/output/skip-when-unaffected behavior is declared in a new `packages/ui/vercel.json`, mirroring `apps/web/vercel.json`/`apps/cms/vercel.json`'s "declare it in code, not the dashboard" philosophy — except this one deliberately omits `git.deploymentEnabled: false`.

**Tech Stack:** Vercel project config (`vercel.json`), `turbo-ignore` (already used elsewhere in this repo for the same skip-when-unaffected purpose), Markdown docs.

## Global Constraints

- Design doc: `docs/superpowers/specs/2026-08-02-storybook-vercel-hosting-design.md` (#339) — approved by the user; this plan implements it exactly, with one mechanical refinement discovered during planning (see Task 1).
- Custom domain: `ui-library.valstack.dev` (production deployment only; PR previews keep Vercel's auto-generated URLs).
- Scope: `@blog/ui` only. No changes to `apps/web`'s Storybook, `.github/workflows/storybook-build.yml` (#1037), or `packages/ui/package.json`'s existing `storybook:build` script.
- No unit-test surface — this is config + docs. "Tests" in this plan are verification commands (JSON validity, the build command Vercel will run, `turbo-ignore` dry-runs), not `*.test.ts(x)` files. Do not create test files for this work.
- `turbo-ignore` version stays pinned in lockstep with `TURBO_IGNORE_VERSION` in `.github/workflows/deploy-development.yml`/`deploy-production.yml` (currently `2.10.4`).
- This is deploy/CI infra, not `packages/config`/`packages/cms`/`packages/service`/`packages/ui` component code — it does not go through the `ui` layer agent, matching the precedent set by `apps/web/vercel.json` and `apps/cms/vercel.json` (#891), both added directly.

---

### Task 1: `packages/ui/vercel.json`

**Files:**

- Create: `packages/ui/vercel.json`

**Interfaces:**

- Consumes: `packages/ui/package.json`'s existing `storybook:build` script (`storybook build`, outputs to the default `storybook-static/` directory — already exists, already proven working in #1037's implementation; do not modify it).
- Produces: `packages/ui/vercel.json`, referenced by prose in `docs/DEPLOY.md`'s new Storybook section (Task 2).

- [ ] **Step 1: Create the file**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "pnpm storybook:build",
  "outputDirectory": "storybook-static",
  "ignoreCommand": "npx turbo-ignore@2.10.4 --task storybook:build @blog/ui"
}
```

Note the one refinement vs. the design doc's snippet: `--task storybook:build` is added to the `ignoreCommand`. `turbo-ignore` defaults to checking the `build` task's dependency graph (`-t, --task <name>` flag, default `"build"`); without this flag it would ask "would the `build` task run for `@blog/ui`?" instead of "would `storybook:build` run?" — the wrong question. Confirmed via `npx turbo-ignore@2.10.4 --help`.

- [ ] **Step 2: Verify the file is valid JSON**

Run: `python3 -c "import json; json.load(open('packages/ui/vercel.json')); print('OK')"`
Expected: `OK`

- [ ] **Step 3: Verify the build command works the way Vercel will invoke it**

Vercel runs `buildCommand` with cwd = Root Directory (`packages/ui`), not the repo root. Confirm that context works:

Run: `(cd packages/ui && pnpm storybook:build)`
Expected: exits 0, ends with `Storybook build completed successfully`, and `packages/ui/storybook-static/` exists (already gitignored — do not commit it).

- [ ] **Step 4: Verify `ignoreCommand` correctly skips when `@blog/ui` is unaffected**

Run: `npx --yes turbo-ignore@2.10.4 --task storybook:build @blog/ui --fallback=HEAD^1`
Expected: exits 0 (turbo-ignore's convention: exit 0 = skip the deploy, nothing relevant changed) — the current `HEAD` commit does not touch `packages/ui` or its dependency graph. If this step is run later and the tip commit happens to touch `packages/ui`, exit 1 is the correct result instead; re-run against a commit known not to touch it (e.g. a docs-only commit) to confirm the skip path specifically.

- [ ] **Step 5: Verify `ignoreCommand` correctly triggers when `@blog/ui` is affected**

Run: `npx --yes turbo-ignore@2.10.4 --task storybook:build @blog/ui --fallback=HEAD~20`
Expected: exits 1 (turbo-ignore's convention: exit 1 = proceed with the deploy) — the last 20 commits include multiple `packages/ui` changes (confirmed via `git log --oneline -5 -- packages/ui` during planning, e.g. `e4c23c93 feat(ui): add icon and hideLabel support to NavLink`).

- [ ] **Step 6: Commit**

```bash
git add packages/ui/vercel.json
git commit -m "chore(dx): add packages/ui/vercel.json for hosted Storybook build config

Declares build/output/skip-when-unaffected config in code for the
upcoming blog-storybook Vercel project (#339) — same philosophy as
apps/web/vercel.json and apps/cms/vercel.json, except this project
deliberately keeps Git integration + PR previews enabled (no
git.deploymentEnabled: false), since @blog/ui carries no Sanity data
or credentials a preview could leak.

Refs #339"
```

---

### Task 2: `docs/DEPLOY.md` and `SPEC.md` updates

**Files:**

- Modify: `docs/DEPLOY.md` (append new section)
- Modify: `SPEC.md` (one new bullet in §13)

**Interfaces:**

- Consumes: `packages/ui/vercel.json` from Task 1 (referenced by path/content in the new `docs/DEPLOY.md` section — write this task after Task 1 is committed).
- Produces: nothing consumed by later tasks — this is the last task in this plan.

- [ ] **Step 1: Read the current end of `docs/DEPLOY.md`**

Run: `tail -20 docs/DEPLOY.md`
Confirm the file currently ends with the "## Post-deploy verification" section's checklist (the last section as of the #891 merge). The new section goes immediately after it, as a new top-level section.

- [ ] **Step 2: Append the new section**

Add this to the end of `docs/DEPLOY.md` (after the existing final line, with one blank line before the `---`):

```markdown
---

## Storybook — hosted `@blog/ui` design system (optional, not a deploy environment)

Unlike everything above, this is **not** part of the dev/prod pipeline — no
Sanity project, no dataset, no CI-gated migration. It's a single Vercel
project hosting `@blog/ui`'s Storybook build for visual PR review, and it
deliberately uses Vercel's Git integration with PR previews **enabled** —
the opposite of `blog-dev`/`blog-prod`/`cms-dev`/`cms-prod`, whose Git
integration is disabled in favor of a CI-gated deploy. That's intentional:
`@blog/ui` is pure and prop-driven (no `service`/Sanity import), so there's
no content or credentials a pre-merge preview could leak — and the entire
point of hosting Storybook is letting a reviewer see a component change
_before_ it merges, which a post-merge-only deploy would defeat. See
`docs/superpowers/specs/2026-08-02-storybook-vercel-hosting-design.md` (#339)
for the full design discussion.

Build/output/skip-when-unaffected config is in code
(`packages/ui/vercel.json`), same philosophy as `apps/web`/`apps/cms`'s
`vercel.json`; only project creation, domain, and confirming Git
integration stays **on** are human-gated console steps:

- [ ] Vercel → Add New → Project → import `ValOvinnikov/blog`; **Root
      Directory `packages/ui`** + tick _"Include files outside of the root
      directory"_; **Node.js 22.x**; Framework Preset **Other** (build/output
      commands come from `packages/ui/vercel.json`).
- [ ] Confirm Git integration is **enabled**, with PR previews **on** — this
      is the default for a newly imported project; the point is to leave it
      as-is, unlike every other project above.
- [ ] Settings → Domains → add `ui-library.valstack.dev` (production
      deployment only — previews keep Vercel's own auto-generated URLs); add
      the DNS record it shows you at whatever registrar/DNS host manages
      `valstack.dev`.
- [ ] No env vars, no CORS, no tokens — `@blog/ui` never imports `service` or
      touches Sanity, so nothing here needs the Sanity/Vercel credential
      dance the rest of this doc walks through.
```

- [ ] **Step 3: Verify the Markdown renders sensibly**

Run: `tail -40 docs/DEPLOY.md`
Expected: the new section appears intact, checkboxes render as `- [ ]`, no broken code fences (count backtick-fence lines: should be even).

- [ ] **Step 4: Add the `SPEC.md` §13 callout**

In `SPEC.md`, section `## 13. Deployment topology`, insert a new bullet immediately after the existing bullet that ends `"...no \`*.sanity.studio\` hosting or \`sanity deploy\` anymore."`and before the`"Deploys are CI-gated..."` bullet:

```markdown
- `@blog/ui`'s Storybook is hosted separately (`blog-storybook` Vercel
  project, `ui-library.valstack.dev`) via Vercel's Git integration with PR
  previews — a deliberate exception to the CI-gated, no-preview pattern
  above, since it carries no Sanity data or credentials. See
  [`docs/DEPLOY.md`](./docs/DEPLOY.md)'s Storybook section.
```

- [ ] **Step 5: Verify `SPEC.md` renders sensibly**

Run: `sed -n '212,250p' SPEC.md`
Expected: the new bullet appears in the right place, the rest of §13 and the start of §14 are unchanged.

- [ ] **Step 6: Commit**

```bash
git add docs/DEPLOY.md SPEC.md
git commit -m "docs(deploy): document hosted @blog/ui Storybook setup

New docs/DEPLOY.md section covering the blog-storybook Vercel project's
human-gated setup (Git integration + PR previews stay ON, the deliberate
exception to this repo's usual pattern) and the ui-library.valstack.dev
domain. SPEC.md §13 gets a one-line callout pointing at it.

Refs #339"
```

---

## Self-Review Notes

- **Spec coverage:** design doc's "What ships in code" section maps 1:1 — `packages/ui/vercel.json` (Task 1), `docs/DEPLOY.md` new section (Task 2 Step 2), `SPEC.md` callout (Task 2 Step 4). "What stays unchanged" (storybook-build.yml, package.json script) — no task touches either, confirmed. "Human-gated" steps are written into the docs, not executed by any task. "Testing / verification" section's two checks (local `pnpm storybook:build`, `turbo-ignore` dry-run pair) are Task 1 Steps 3–5.
- **No placeholders:** every step has exact file content or exact commands with expected output.
- **Type/name consistency:** `packages/ui/vercel.json`'s `outputDirectory: "storybook-static"` matches the existing (unmodified) `storybook:build` script's default output dir, confirmed against `packages/ui/.gitignore`/root `.gitignore` already ignoring it (established during #1037). Domain `ui-library.valstack.dev` is consistent across the design doc, this plan, and both doc edits.
