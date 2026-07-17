# Blog

[![CI](https://github.com/ValOvinnikov/blog/actions/workflows/ci.yml/badge.svg)](https://github.com/ValOvinnikov/blog/actions/workflows/ci.yml)

A CMS-driven blog built as a **Turborepo + pnpm monorepo** with strict
separation of concerns: a headless Sanity Studio for authoring, a Next.js
frontend for reading, a portable design system, and a typed data layer — with
end-to-end TypeScript type safety from schema to screen.

> **Docs:** [`SPEC.md`](./SPEC.md) is the durable product + architecture
> reference — start there. [`docs/BACKLOG.md`](./docs/BACKLOG.md) is the
> ticket-ready roadmap.
> [`docs/archive/IMPLEMENTATION_BRIEF.md`](./docs/archive/IMPLEMENTATION_BRIEF.md)
> is the archived bootstrap playbook (historical only).

## Stack

- **Next.js 16** (App Router, React Server Components, TS strict) + **React 19** — `apps/web`
- **Sanity Studio v6** (headless CMS, typegen source) — `apps/cms`
- **Tailwind CSS v4** with shared design tokens + `tailwind-variants`
- **next-intl** i18n (locale-prefix-free URLs)
- **Atomic Design** component library — `packages/ui`
- **Vitest + Testing Library** for unit tests; **Storybook** in `ui` and `web`
- **Turborepo + pnpm** workspaces, **TypeScript** everywhere

## Monorepo layout

```
apps/
  cms        Sanity Studio: schemas, editorial UI, typegen source   (cms)
  web        Next.js frontend: routes, SEO, composition             (web)
packages/
  service    Data access: Sanity client, groqd queries, transformers (@blog/service)
  ui         Atomic Design component library (pure, prop-driven)     (@blog/ui)
  config     Constants, generated Sanity types, shared TS types      (@blog/config)
  utils      Framework-free helpers (async, primitives)              (@blog/utils)
configs/
  eslint / prettier / tailwind / tsconfig / vitest presets           (@blog/*-config)
```

### Dependency rules (enforced, acyclic)

```
web → ui, service, config, utils
service → config, utils   (no React, ever)
ui → config               (no Sanity, no data fetching — stays publishable)
cms → config              (generates the types typegen ships into config)
configs/* → consumed by all
```

`web` is the **only** place `ui` and `service` meet: Server Components fetch
data through `service` and pass plain typed props into `ui`. Internal packages
ship raw TypeScript (Just-in-Time pattern) and are transpiled by the web app via
`transpilePackages`.

## Getting started

Requires **Node 20.19+** and **pnpm 9+**.

```bash
pnpm install

# Copy env templates and fill in your Sanity project values
cp apps/web/.env.example apps/web/.env.local
cp apps/cms/.env.example apps/cms/.env.local
```

Environment variables (see `.env.example`):

| Variable                        | Purpose                                  |
| ------------------------------- | ---------------------------------------- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project id                        |
| `NEXT_PUBLIC_SANITY_DATASET`    | usually `production`                     |
| `NEXT_PUBLIC_SITE_URL`          | canonical origin for SEO / sitemap / RSS |
| `SANITY_API_READ_TOKEN`         | drafts / preview only                    |
| `SANITY_REVALIDATE_SECRET`      | on-demand ISR webhook secret             |

Add `http://localhost:3000` (and your deployed origin) to the project's CORS
origins at [manage.sanity.io](https://manage.sanity.io).

## Scripts (run from the repo root)

| Command           | What it does                                        |
| ----------------- | --------------------------------------------------- |
| `pnpm dev`        | Run all workspaces in dev (Next.js + Sanity Studio) |
| `pnpm build`      | Build everything (`typegen` runs first)             |
| `pnpm test`       | Run Vitest across packages                          |
| `pnpm test:watch` | Vitest in watch mode                                |
| `pnpm type-check` | `tsc --noEmit` across the graph                     |
| `pnpm lint`       | ESLint across packages                              |
| `pnpm typegen`    | Regenerate Sanity types into `@blog/config`         |
| `pnpm format`     | Prettier write                                      |

Scope to one workspace with `pnpm --filter <name>`, e.g.
`pnpm --filter web dev` or `pnpm --filter @blog/ui test`.

## Content model

Defined as Sanity schemas in `apps/cms/src/schema-types/` (current model in
`SPEC.md` §6): `post`, `author`, `category`, `page`, the `homePage` /
`siteSettings` / `settings_navigation` / `settings_footer` singletons, and
shared objects (unified `link`, `seo`/`openGraph`, `imageWithAlt`, `brand`).
Schema changes regenerate `packages/config/src/sanity/generated/types.ts` via
`pnpm typegen` — commit the generated files. Changes to _existing_ shapes need
a content migration (`apps/cms/migrations/README.md`) — production runs are
human-gated.

## Type flow

```
Sanity schema (cms) ──typegen──► @blog/config ──► @blog/service ──► web ──props──► @blog/ui
```

One source of truth: a schema change surfaces as a TypeScript error anywhere a
consumer is out of date.

## Working with Claude Code

This repo ships Claude Code configuration so contributors stay inside the layer
contracts:

- **Scoped subagents** (`.claude/agents/`) — one per layer, primed with that
  layer's rules:
  - `config` — `packages/config`, `packages/utils`, `configs/*`: UPPERCASE
    constants, the `routes` URL builder, shared config packages, cross-workspace
    alias wiring, guards `src/sanity/generated/` (typegen-only).
  - `cms` — Sanity schemas, content modelling, typegen.
  - `service` — Sanity client, GROQ, typed fetchers (no React).
  - `ui` — building the pure, publishable `@blog/ui` design system.
  - `web` — App Router routes, SEO, composition of `ui` + `service`.
  - `reviewer` — read-only pre-commit review of the full diff; gates the
    commit ask on an `APPROVE` verdict.
  - `a11y-reviewer` — read-only accessibility audit of `packages/ui`/`apps/web`
    diffs against `ui-library-practices`' non-negotiable rules; dispatched
    alongside `reviewer` whenever a diff touches those layers.
  - `explore` — read-only discovery scout (Haiku). Answers "where is X / how
    does Y work" sweeps in a cheap, disposable context and returns conclusions
    with `file:line` pointers instead of file dumps, so the orchestrator's
    window isn't spent rediscovering the codebase.
  - `test-writer` — adds/extends co-located `*.test.ts(x)` coverage after the
    layer agents finish implementing, so test quality doesn't depend on each
    layer agent's leftover attention at the end of its run. Scoped to test
    files by **enforcement** (#396) on both tool surfaces it has: a
    `PreToolUse` guard (`test-writer-scope-guard.sh`) denies any `Edit`/
    `Write` outside `*.test.ts(x)`, and `permissionMode: dontAsk` +
    `read-only-agent-guard.sh` (reused as-is from `reviewer`/`explore` below)
    denies the same write-shaped `Bash` commands — closing the `mv`/`cp`
    bypass that would otherwise move or overwrite a file outside the
    Edit/Write check entirely. A needed product-code change comes back as a
    finding for the orchestrator to route, never a fix this agent makes
    itself.
  - `seo-auditor` — read-only SEO/metadata audit of the full diff, dispatched
    alongside `reviewer` (never instead of it) whenever a change touches
    `apps/web` routes, metadata, structured data, or feeds. Applies the
    `seo-and-metadata` skill as a checklist (`generateMetadata` completeness,
    JSON-LD validity, sitemap/robots/RSS coherence) and reports a verdict in
    the same `APPROVE` / blocking / non-blocking / not-checked format.
  - `board-keeper` — reconciles the Blog Build project board against repo
    reality (open PR → issue in Code Review, in-flight branch → In Progress,
    merged PR → issue Done). Re-queries every status write it makes to catch
    `gh project item-edit`'s known silent-failure mode, and reports
    destructive-looking moves (e.g. reopening a wrongly-closed issue) for the
    orchestrator instead of applying them. Dispatched after every PR
    open/merge, and on demand.

  `reviewer`, `a11y-reviewer`, `seo-auditor`, and `explore` are read-only by
  **enforcement**, not just prose (#425); `test-writer` reuses the same `Bash`
  guard although it isn't fully read-only (#396). All five run under
  `permissionMode: dontAsk`, so any Bash call the permission engine would
  prompt for (redirects, `sed -i`, `tee`, unrecognized binaries) is
  auto-denied, and a per-agent `PreToolUse` guard (`read-only-agent-guard.sh`)
  denies the write-shaped commands the project allow-list would otherwise
  admit (`git commit` — including with leading global flags like
  `git -C dir commit`, `mkdir`, `cp`, `pnpm typegen`, `pnpm exec`/
  `pnpm --filter ... exec`, …). Residual, accepted: commands that execute
  package scripts the allow-list doesn't flag as write-shaped (`pnpm test`,
  `pnpm dev`, `turbo run`) can still write, and the guard's quote-naive
  segment splitting can false-positive on search patterns containing e.g.
  `&& mkdir ` — denials tell the agent to fall back to Grep/Read. This is a
  guardrail against honest confusion, not a security boundary — it doesn't
  chase further obfuscation (case-insensitive filesystem tricks,
  path-qualified binaries, wrapper commands); see #397 for why full
  adversarial-proof text-level enforcement was rejected as not worth its
  false-positive cost.

- **Hooks** (`.claude/hooks/`):
  - `post-edit-prettier.sh` → `post-edit-lint.sh` — `PostToolUse` hooks (wired
    in `.claude/settings.json` as a single chained command,
    `post-edit-prettier.sh && post-edit-lint.sh`) so every agent-edited/written
    file is Prettier-formatted, then linted on the formatted content, in the
    same turn. They're chained rather than two entries under the same
    matcher because Claude Code runs all hooks matching an event in
    parallel — two array entries would race and ESLint could see pre-format
    content. `post-edit-prettier.sh` always exits 0 and gives no agent
    feedback (formatting, not review); unsupported/missing files and
    `.prettierignore`'d paths are silent no-ops via Prettier itself.
    `post-edit-lint.sh` lints every agent-edited `.ts`/`.tsx` file and feeds
    errors — including layer-boundary `no-restricted-imports` violations —
    back to the agent. Report-only (never `--fix`); the commit-time gates
    (lint-staged) stay authoritative.
  - `pre-bash-worktree-install-guard.sh` — `PreToolUse` hook that blocks
    dependency-mutating pnpm commands inside a shared-deps agent worktree
    (see below) before pnpm can write anything.
  - `read-only-agent-guard.sh` — `PreToolUse` hook (wired in the `reviewer`,
    `a11y-reviewer`, `explore`, `seo-auditor`, and `test-writer` agent
    frontmatter — `test-writer` sets a `GUARD_LABEL` env var on its hook
    command so the deny message names it correctly rather than calling it
    "read-only")
    backing the enforcement described above. Its deny list mirrors the
    write-shaped entries in `settings.json` `permissions.allow` — keep the
    two in sync. `read-only-agent-guard.test.sh` pins the deny/allow matrix
    (including the bypasses found across #425's review rounds); run it
    directly or via CI (**Hooks**, below).
  - `test-writer-scope-guard.sh` — `PreToolUse` hook (wired in the
    `test-writer` agent frontmatter) that denies any `Edit`/`Write` whose
    target isn't `*.test.ts`/`*.test.tsx`, backing the test-file-only scoping
    described above.
- **Shared `node_modules` in agent worktrees** — a full `pnpm install` per
  isolated worktree duplicated ~1.1 GB and minutes of setup each time, so
  `.husky/post-checkout` seeds every new linked worktree instead (issue #410):
  - the root `node_modules` becomes a **symlink** to the primary checkout's
    copy — that directory holds pnpm's content-addressed `.pnpm` store, i.e.
    every external package;
  - each workspace `node_modules` is a tiny **copy of pnpm's symlink farm**
    (`cp -RP`). pnpm's links are relative, so `@blog/*` resolve to the
    _worktree's own source_ while external packages resolve through the root
    symlink into the primary checkout's store. A fresh worktree costs ~80 MB
    (source + farms) instead of ~1.2 GB, and removal is fast.
  - `apps/web/next.config.ts` anchors `turbopack.root` at the checkout that
    physically hosts the dependencies (via `realpath` of `node_modules`) —
    Turbopack otherwise refuses to resolve through a symlink that leaves its
    project root. In the primary checkout and on Vercel this resolves to the
    workspace root, exactly what Turbopack infers anyway.
  - **Installing inside a shared worktree is unsupported** — pnpm follows the
    root symlink, so `pnpm install`/`add`/... would prune and rewrite the
    _primary checkout's_ dependencies. Three layers prevent it: the
    `PreToolUse` hook blocks agent-issued pnpm mutations up front, the root
    `preinstall` script (`scripts/guard-worktree-install.mjs`) aborts any
    install that slips through before pnpm links anything, and pnpm itself
    prompts before reusing a virtual store created at another path. On a
    branch that must change dependencies, give the worktree a private tree:
    `rm node_modules` (removes only the symlink) then `pnpm install`.
  - Why not the harness's `worktree.symlinkDirectories` setting: it can only
    symlink whole directories, which works for the root but would point the
    workspace-level `node_modules` at the primary checkout — and their
    `@blog/*` links would then resolve to the _primary checkout's source_,
    silently building stale code. The `post-checkout` hook produces the
    farm copies the pnpm layout needs, covers manually created worktrees
    too, and keeps a single mechanism in charge.

- **Skills** (`.claude/skills/`):
  - `develop-feature` — the lifecycle playbook (investigate → delegate per layer → test → review → commit → remove the subagent worktrees); start here for non-trivial work.
  - `add-content-type` — end-to-end recipe spanning all layers (schema → types → service → ui → web).
  - `cms-schema-practices` — Sanity schema quality bar + content-migration workflow.
  - `ui-library-practices` — building pure, prop-driven design-system components.
  - `ui-storybook` / `web-storybook` — Storybook conventions per workspace.
  - `testing-practices` — Vitest + Testing Library conventions.
  - `seo-and-metadata` — per-route metadata, JSON-LD, sitemap/robots/RSS.
  - `code-review-practices` — boundary/type/SEO/test checklist before a PR.
  - `open-pull-request` — branch → work → PR with human-gated push/PR steps.
  - `use-context7` — fetch live, version-matched library docs before guessing.
- **Settings** (`.claude/settings.json`) — permission allowlist for the standard
  pnpm/turbo/sanity/git/gh commands and hook wiring; deploys and hand-edits to
  the generated Sanity types (`packages/config/src/sanity/generated/`, regenerate
  via `pnpm typegen`) are denied, as are reads/writes of real env files
  (`.env`, `.env.local`, `.env.*.local`) — the tracked `.env.example` templates
  stay readable and editable so agents can maintain them. It also provisions
  the plugins the repo's own guidance depends on
  (currently **context7**, required by the `use-context7` skill) via
  `extraKnownMarketplaces` + `enabledPlugins`, so a fresh clone resolves them
  without per-person setup. Opt out locally in `.claude/settings.local.json`.
- **`CLAUDE.md`** — repo-wide guidance loaded into every session.

## CI & automation

All automation lives in `.github/workflows/` (shared pnpm/Node setup in
`.github/actions/setup`; Dependabot bumps npm + GitHub Actions weekly).

| Workflow                                          | Trigger                                                 | What it does                                                                                                                                                                                                                                                                             |
| ------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CI** (`ci.yml`)                                 | every PR to `main`                                      | The quality gates: **Type-check**, **Lint**, **Test**, **Typegen** (regenerates schema + types and fails if the committed output in `packages/config/src/sanity/generated/` is stale), **Migrations** (loads every migration + read-only dry-run against the dataset), **Build**.        |
| **Dependency Review**                             | every PR to `main`                                      | Blocks dependency changes with known vulnerabilities (`fail-on-severity: high`; no license policy configured).                                                                                                                                                                           |
| **Zizmor** (`zizmor.yml`)                         | every PR to `main`                                      | Static security analysis of the workflow files themselves.                                                                                                                                                                                                                               |
| **Actionlint** (`actionlint.yml`)                 | every PR to `main`                                      | Validates the workflow files' syntax, `${{ }}` expressions and `needs` graph, and shellchecks their `run:` blocks — the correctness half that Zizmor's security analysis does not cover. Runs the official binary, pinned by version + sha256 (no third-party action, no curl-to-shell). |
| **Knip** (`knip.yml`)                             | every PR to `main`                                      | Reports unused files, exports, and dependencies (config in `knip.json`); read-only, fails on any finding or a stale ignore rule. Advisory for now — promoted to a required check after two weeks of zero false positives (human-gated ruleset change).                                   |
| **Hooks** (`hooks.yml`)                           | every PR to `main`                                      | Shellchecks `.claude/hooks/*.sh` (outside actionlint's `run:`-block-only coverage) and runs `read-only-agent-guard.test.sh`'s deny/allow matrix against `read-only-agent-guard.sh`.                                                                                                      |
| **Test Presence** (`test-presence.yml`)           | every PR to `main` (incl. label add/remove)             | Advisory nudge: fails when source under `packages/*/src` or `apps/web/src` changes without touching any `*.test.ts(x)` file. Ignores stories, configs, `*.d.ts`, generated types, deletions, and `apps/cms`. Waive with the `no-tests-needed` label; never a required check.             |
| **Claude Code Review** (`claude-code-review.yml`) | PR opened/updated (code paths, owner PRs only)          | Automated AI review posted on the PR; advisory, not a required check.                                                                                                                                                                                                                    |
| **Claude Code** (`claude.yml`)                    | `@claude` mentions (owner-only, owner-authored threads) | Interactive agent runs on issues/PRs.                                                                                                                                                                                                                                                    |
| **Deploy Development** (`deploy-development.yml`) | push to `main` (+ manual dispatch)                      | `turbo-ignore` change detection → verify (type-check/lint/test/build) → auto-apply pending content migrations to the dev dataset → deploy only the affected app(s) to the dev environment.                                                                                               |
| **Deploy Production** (`deploy-production.yml`)   | `vX.Y.Z` tag push                                       | Verify → back up the production dataset (artifact) → gated prod content migration → deploy Studio + web to production. Cutting a release = pushing a tag, so it stays under the human push gate.                                                                                         |

**Required status checks on `main`:** Type-check, Lint, Test, Typegen, Build,
Migrations, Dependency Review. Everything else is advisory. CI runs on every
PR without path filters on purpose — a path-skipped workflow leaves its
required checks pending forever (see the comment in `ci.yml`).

**Test Presence stays advisory by design.** Refactors, type-only changes, and
pure re-exports legitimately carry no test delta, so the job nudges rather than
blocks — don't add it to the required checks. When a change genuinely needs no
test, apply the `no-tests-needed` label: the override then lives on the PR where
reviewers can see it, instead of in a bypassed check.

One-time environment setup (datasets, tokens, Vercel projects, secrets,
webhooks, CORS) is human-gated console work — see [`docs/DEPLOY.md`](./docs/DEPLOY.md)
and `SPEC.md` §13. Manual `sanity deploy` / Vercel deploys are never run by
hand (agent permissions deny them; the pipeline owns deploys).

## License

Private project — all rights reserved.
