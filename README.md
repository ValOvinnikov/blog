# Blog

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/brand/mark-dark.svg">
  <img src="docs/brand/mark-light.svg" width="72" alt="Brand mark">
</picture>

```
> brand: command not found
```

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

## Shared dependency versions (pnpm catalogs)

Dependencies pinned to the same version across every workspace live once in
`pnpm-workspace.yaml`'s `catalog:` block instead of being hardcoded in each
`package.json`:

```yaml
# pnpm-workspace.yaml
catalog:
  typescript: ^6.0.3
```

A consuming `package.json` references the catalog entry instead of a version
range:

```json
"typescript": "catalog:"
```

Run `pnpm install` after adding or changing a catalog entry — pnpm resolves
the `catalog:` protocol against `pnpm-workspace.yaml` and records the
resolved version in `pnpm-lock.yaml` per package, same as any other
specifier. **Only promote a dependency to the catalog once at least two
workspaces pin it to the identical version** — a single consumer, or
consumers that intentionally diverge, should keep a normal version range.
To add a new catalog entry: add the key under `catalog:`, replace every
matching hardcoded version with `"catalog:"` in each consuming
`package.json`, then run `pnpm install` and confirm the lockfile diff only
changes `specifier` fields (not resolved `version` fields) — a version bump
belongs in its own change, not bundled with a catalog migration.
The `catalog:` protocol resolves identically in a `dependencies`,
`devDependencies`, or `peerDependencies` block — `react`/`react-dom` (in
`dependencies` for `apps/cms`/`apps/web`, `peerDependencies` for
`packages/ui`) confirmed this alongside the earlier `devDependencies`-only
migrations.

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
  - `verify-runner` — read-only, Haiku-model runner for the integration
    verify pass (`develop-feature` §5: `type-check`/`lint`/`test`,
    the exact scenario-specific sequence it's given). `build` is not part of
    the routine sequence — CI's `ci.yml` `build` job gates every PR, so a
    local re-run would just duplicate it; `verify-runner` still runs `build`
    on request when reproducing an actual CI build failure
    (`open-pull-request` Gate 5a). Dispatched **synchronously** (not
    background — verify blocks `reviewer`, so there's no other work to queue
    while waiting) right before step 6's review. Runs each command in order,
    stops at the first failure, and reports which command failed plus
    trimmed output — no root-cause diagnosis or fix suggestion. Never given
    `pnpm typegen`: that mutates generated files, which its read-only guard
    denies, so typegen still runs inline in the orchestrator's own session
    first. That replaces running the verify commands directly in the
    orchestrator's own turn, which put `turbo run type-check`/`lint`/`test`
    output across up to 11 packages permanently into its context for a
    purely mechanical pass/fail job.
  - `reviewer` — read-only pre-commit review of the full diff; gates the
    commit ask on an `APPROVE` verdict. Trusts `verify-runner`'s already-passed
    `type-check`/`lint`/`test` result rather than re-running it.
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
  - `board-keeper` — creates new issues and reconciles the Blog Build
    project board against repo reality (open PR → issue in Code Review,
    in-flight branch → In Progress, merged PR → issue Done, a completed
    parent issue whose sub-issues all trace to merged PRs → Done, every
    open issue/PR carries at least one label). Also propagates parent/epic
    status both ways: a parent still `Todo` moves to In Progress the moment
    any of its sub-issues does, and a parent whose sub-issues are all
    complete but is still open gets flagged (not auto-closed — closing an
    issue stays a judgment call) rather than sitting unnoticed. Issue
    creation is a single choke point — the orchestrator never calls
    `gh issue create` directly;
    it dispatches `board-keeper` with a fully-specified title/body/labels
    (and a parent issue number if it's a sub-issue), which creates the
    issue, places it on the board, and confirms status/labels/parent-link
    as one verified operation, so creation and placement can never be
    decoupled into a forgettable second step. Re-queries every status write
    it makes to catch `gh project item-edit`'s known silent-failure mode,
    checks the active `gh` token carries the `project` scope before writing
    anything (board writes fail outright without it — not part of GitHub's
    default OAuth scopes), and reports destructive-looking moves (e.g.
    reopening a wrongly-closed issue) for the orchestrator instead of
    applying them. Dispatched to create any new issue, when starting work on
    an issue (`open-pull-request` Gate 0 — sets the issue itself to In
    Progress and promotes a Todo/blank parent in the same dispatch,
    synchronously, since branch checkout depends on the result), after every
    PR open/merge, and on demand. Targeted triggers — creation, start-of-work,
    after-PR, after-merge, after-filing — are cheap, single-issue checks by
    default and do not cascade into a full board sweep — append "...also
    reconcile the board" to opt in, or dispatch it bare with no issue number
    for an unconditional full sweep. Measured: a targeted check runs 15-100s,
    a full sweep 100-450s.
  - `ci-watcher` — read-only, Haiku-model watcher for a single PR's CI
    checks (#464). Dispatched in the background right after `open-pull-request`
    Gate 5, with the PR's actual number (never the issue number or a bare
    branch) so it needs no worktree/branch context of its own. Runs
    `gh pr checks <n> --watch` to a terminal state and reports pass/fail —
    on failure, the check name, run/job URL, and a raw `--log-failed`
    excerpt, handed back as data with no root-cause diagnosis or fix
    suggestion. That replaces running `--watch` synchronously in the
    orchestrator's own turn, which measured ~3,000–3,500 tokens of polling
    output landing permanently in its context (paid again every turn until
    compaction) and blocked the session for the minutes CI took.

  `reviewer`, `a11y-reviewer`, `seo-auditor`, `explore`, `ci-watcher`, and
  `verify-runner` are read-only by **enforcement**, not just prose (#425,
  #464, #466); `test-writer` reuses the same `Bash` guard although it isn't
  fully read-only (#396). All seven run under `permissionMode: dontAsk`, so
  any Bash call the permission engine would prompt for (redirects, `sed -i`,
  `tee`, unrecognized binaries) is auto-denied, and a per-agent `PreToolUse`
  guard (`read-only-agent-guard.sh`)
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
  - `gate-bypass-guard.sh` — `PreToolUse` hook, wired **globally** in
    `.claude/settings.json` (every agent's `Bash` calls, not one agent's —
    bypass commands could come from any context, including the
    orchestrator). Blocks the plain, unobfuscated forms of `git` commands
    that skip the husky gates or rewrite pushed history: a literal
    `--no-verify`/`-n` on `commit`/`push`/`merge`, a literal
    `--force`/`-f`/`--force-with-lease`/`+refspec` on `push`, and
    `core.hooksPath` on `git config`. A quote-aware tokenizer (not a regex
    over the raw string) keeps a quoted commit message — including this
    repo's own multi-line `-m "$(cat <<'EOF' ... EOF)"` convention — as one
    value token that can never be misread as a flag; that distinction is
    what a discarded, more ambitious first attempt at this hook (#397) got
    wrong before it was fixed. That attempt chased ~15 real bypasses across
    five review rounds and was discarded anyway, because its false-positive
    rate on honest commands (it blocked its own commit message for merely
    mentioning `--no-verify`) cost more than the shortcuts it prevented. This
    version deliberately does not chase further obfuscation — env var
    indirection, shell recursion, case-insensitive filesystems,
    path-qualified binaries, wrapper commands, clustered short flags,
    quote-splitting, backslash-newline continuations — same posture as
    `read-only-agent-guard.sh` below. `gate-bypass-guard.test.sh` pins the
    deny/allow matrix, reusing the discarded attempt's proven
    legitimate-command bank; run it directly or via CI (**Hooks**, below).
  - `read-only-agent-guard.sh` — `PreToolUse` hook (wired in the `reviewer`,
    `a11y-reviewer`, `explore`, `seo-auditor`, `ci-watcher`, `verify-runner`,
    and `test-writer` agent frontmatter — `test-writer` sets a `GUARD_LABEL`
    env var on its hook command so the deny message names it correctly
    rather than calling it "read-only")
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
- **Env files in agent worktrees** (issue #404) — the same
  `.husky/post-checkout` hook copies `.env.local`/`.env.*.local` from the
  primary checkout into every new linked worktree, so `pnpm build` works
  there without an agent ever touching a real env file directly (the deny
  rules in `.claude/settings.json` block `Bash(cp *.env*)`/`Bash(mv *.env*)`
  and Read/Edit/Write on `.env.local` — the hook runs as a git subprocess,
  invisible to and unaffected by that permission layer). Verified end-to-end:
  a fresh worktree gets seeded and `pnpm --filter web build` passes green
  inside it, deny rules active throughout.
  - **Edge case:** a worktree created before husky's hooks are wired up
    (i.e. before `pnpm install` has ever run once in the primary checkout —
    `prepare: husky` in the root `package.json` is what wires them) is
    created **unseeded**, and an agent cannot self-heal — the deny rules
    block a manual `cp`/`mv` with no prompt. The resulting build failure is
    an ordinary missing-env-var error from Next.js/Sanity (a structured
    `@t3-oss/env-nextjs` "Invalid environment variables" message naming the
    missing key), not a mystery stack trace; if you hit one in a worktree,
    first check whether `apps/web/.env.local` exists there at all. Fix is
    human-only: run `pnpm install` once in the primary checkout (wires the
    hooks), then either re-create the worktree, or — since hooks are shared
    across worktrees via the common `.git` dir — trigger a re-seed in the
    existing one with any `git checkout` (the hook skips already-present
    files, so it only fills the gaps).

- **Skills** (`.claude/skills/`):
  - `develop-feature` — the lifecycle playbook (investigate → delegate per layer → test → review → commit → remove the subagent worktrees); start here for non-trivial work.
  - `add-content-type` — end-to-end recipe spanning all layers (schema → types → service → ui → web).
  - `cms-schema-practices` — Sanity schema quality bar + content-migration workflow.
  - `ui-library-practices` — building pure, prop-driven design-system components.
  - `web-component-practices` — building interactive `apps/web` components (compose `@blog/ui` via slots, client behaviour in ref-based hooks).
  - `ui-storybook` / `web-storybook` — Storybook conventions per workspace.
  - `testing-practices` — Vitest + Testing Library conventions.
  - `seo-and-metadata` — per-route metadata, JSON-LD, sitemap/robots/RSS.
  - `code-review-practices` — boundary/type/SEO/test checklist before a PR.
  - `open-pull-request` — branch → work → PR with human-gated push/PR steps.
  - `use-context7` — fetch live, version-matched library docs before guessing.
  - Plugin skills (provisioned via `.claude/settings.json`, see below):
    `superpowers:systematic-debugging`, `superpowers:test-driven-development`,
    `superpowers:verification-before-completion`, `superpowers:writing-skills`,
    `superpowers:brainstorming` and `superpowers:using-git-worktrees` (invoked
    by `develop-feature`), `vercel:nextjs`, `vercel:next-cache-components`,
    `vercel:deployments-cicd`, `frontend-design:frontend-design`.
- **Settings** (`.claude/settings.json`) — permission allowlist for the standard
  pnpm/turbo/sanity/git/gh commands and hook wiring; deploys and hand-edits to
  the generated Sanity types (`packages/config/src/sanity/generated/`, regenerate
  via `pnpm typegen`) are denied, as are reads/writes of real env files
  (`.env`, `.env.local`, `.env.*.local`) — the tracked `.env.example` templates
  stay readable and editable so agents can maintain them. It also provisions
  plugins via `extraKnownMarketplaces` + `enabledPlugins`, so a fresh clone
  resolves them without per-person setup: **context7** (required by the
  `use-context7` skill), **superpowers** (required by `develop-feature` and
  the plugin skills above), **frontend-design**, **typescript-lsp**,
  **vercel**, **code-simplifier**, **claude-md-management**, **skill-creator**,
  **code-review**, **feature-dev**, **security-guidance**,
  **claude-code-setup**, **playwright**, and **sanity** — all from the single
  `claude-plugins-official` marketplace. Because the `vercel` plugin bundles a
  `/deploy` command and `deployment-expert` subagent that can trigger a real
  deploy, the deny list also blocks the underlying `vercel --prod` /
  `vercel deploy --prod` / `vercel promote` / `vercel rollback` commands and
  the `deploy_to_vercel` MCP tool, so enabling the plugin can't bypass this
  repo's human-gated deploy policy. Opt out locally in
  `.claude/settings.local.json`.
- **`.mcp.json`** (project root) — declares the `github` MCP server (Copilot's
  hosted `https://api.githubcopilot.com/mcp` endpoint), authenticated with a
  static `Authorization: Bearer ${GITHUB_PAT}` header rather than OAuth —
  GitHub's auth server doesn't support the dynamic client registration
  Claude Code's automatic MCP login needs. Each contributor exports their own
  `GITHUB_PAT` (a GitHub personal access token) in their shell profile; never
  put the token value in this repo.
- **Scheduled cloud routines** — a Claude Code "routine" (`/schedule`, backed
  by the `RemoteTrigger` API — cloud infrastructure, not a local cron job)
  runs daily and posts a summary of what merged in the last 24 hours, plus a
  retrospective code-review pass on any code-touching PR. It is read-only end
  to end (no `gh pr comment`, no file writes, no git commits) — the summary is
  delivered only via the routine's own push/email notification. See
  `docs/routines/release-notes-drafter.md` for the full prompt, current
  enabled/disabled status, and incident history; that file is a
  version-controlled reference copy, so editing it has no effect on the live
  routine — update both places if the prompt changes.
- **`CLAUDE.md`** — repo-wide guidance loaded into every session.

## CI & automation

All automation lives in `.github/workflows/` (shared pnpm/Node setup in
`.github/actions/setup`; Dependabot bumps npm + GitHub Actions weekly).

| Workflow                                            | Trigger                                                 | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CI** (`ci.yml`)                                   | every PR to `main`                                       | The quality gates: **Type-check**, **Lint**, **Test**, **Typegen** (regenerates schema + types and fails if the committed output in `packages/config/src/sanity/generated/` is stale), **Migrations** (loads every migration + read-only dry-run against the dataset), **Build**.                                                                                                                                                                                                                                                       |
| **Dependency Review**                               | every PR to `main`                                       | Blocks dependency changes with known vulnerabilities (`fail-on-severity: high`; no license policy configured).                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Zizmor** (`zizmor.yml`)                           | every PR to `main`                                       | Static security analysis of the workflow files themselves. Required status check ([#462](https://github.com/ValOvinnikov/blog/issues/462)).                                                                                                                                                                                                                                                                                                                                                                                              |
| **Actionlint** (`actionlint.yml`)                   | every PR to `main`                                       | Validates the workflow files' syntax, `${{ }}` expressions and `needs` graph, and shellchecks their `run:` blocks — the correctness half that Zizmor's security analysis does not cover. Runs the official binary, pinned by version + sha256 (no third-party action, no curl-to-shell). Required status check ([#462](https://github.com/ValOvinnikov/blog/issues/462)).                                                                                                                                                             |
| **Knip** (`knip.yml`)                               | every PR to `main`                                       | Reports unused files, exports, and dependencies (config in `knip.json`); read-only, fails on any finding or a stale ignore rule. Required status check ([#462](https://github.com/ValOvinnikov/blog/issues/462)).                                                                                                                                                                                                                                                                                                                        |
| **Commitlint** (`commitlint.yml`)                   | every PR to `main`                                       | Backstop for the `.husky/commit-msg` hook: lints every commit in the PR's range against the root `commitlint.config.mjs` (Conventional Commits + this repo's `tooling` type). Merge commits are skipped; Dependabot's `chore(deps): …` messages are not separately exempted — they pass because they're already conventional. Required status check ([#462](https://github.com/ValOvinnikov/blog/issues/462)).                                                                                                                          |
| **Hooks** (`hooks.yml`)                             | every PR to `main`                                       | Shellchecks `.claude/hooks/*.sh` (outside actionlint's `run:`-block-only coverage) and runs `read-only-agent-guard.test.sh`'s, `gate-bypass-guard.test.sh`'s, `pre-bash-worktree-install-guard.test.sh`'s, and `test-writer-scope-guard.test.sh`'s deny/allow matrices against their respective guards. Required status check (job name `Shellcheck + guard tests` — [#462](https://github.com/ValOvinnikov/blog/issues/462)).                                                                                                          |
| **Test Presence** (`test-presence.yml`)             | every PR to `main` (incl. label add/remove)               | Advisory nudge: fails when source under `packages/*/src` or `apps/web/src` changes without touching any `*.test.ts(x)` file. Ignores stories, configs, `*.d.ts`, generated types, deletions, and `apps/cms`. Waive with the `no-tests-needed` label; never a required check.                                                                                                                                                                                                                                                            |
| **Claude Code Review** (`claude-code-review.yml`)   | PR opened/updated (code paths, owner PRs only)            | Automated AI review posted on the PR; advisory, not a required check.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Claude Code** (`claude.yml`)                      | `@claude` mentions (owner-only, owner-authored threads)   | Interactive agent runs on issues/PRs. Decided advisory ([#462](https://github.com/ValOvinnikov/blog/issues/462)) — it's a Claude-driven review/automation workflow, not a deterministic lint/type/test gate, so a transient failure there shouldn't block every merge.                                                                                                                                                                                                                                                                  |
| **Deploy Development** (`deploy-development.yml`)   | push to `main` (+ manual dispatch)                        | `turbo-ignore` change detection → verify (type-check/lint/test/build) → auto-apply pending content migrations to the dev dataset → deploy only the affected app(s) to the dev environment.                                                                                                                                                                                                                                                                                                                                               |
| **Deploy Production** (`deploy-production.yml`)     | `vX.Y.Z` tag push                                         | Verify → back up the production dataset (artifact) → gated prod content migration → deploy Studio + web to production. Cutting a release = pushing a tag, so it stays under the human push gate.                                                                                                                                                                                                                                                                                                                                        |
| **Lighthouse CI** (`lighthouse.yml`)                | every PR to `main`                                       | Advisory Lighthouse CI budget assertions (performance ≥ 90, accessibility ≥ 95, best-practices ≥ 90, SEO ≥ 95 — `.lighthouse/budgets.json`, documented in `.lighthouse/README.md`) against a preview URL for `/` and one post page. **Currently a no-op green**: this repo has no PR preview deploys for web by design (SPEC §13), so the job's Lighthouse step is guarded on the repo Variable `LIGHTHOUSE_URLS` and only runs once a preview/smoke URL is produced.                                                                |
| **Playwright smoke** (`playwright-smoke.yml`)       | every PR to `main`                                       | Minimal e2e smoke suite (`apps/web/e2e/`): home page and one post-detail page (discovered dynamically from a live link, no hardcoded slug) each render 200 with zero console errors, run against `SMOKE_URL`. **Currently a no-op green** for the same reason as Lighthouse CI above — no PR preview deploys yet, so the job is guarded on the repo Variable `SMOKE_URL` ([#275](https://github.com/ValOvinnikov/blog/issues/275)).                                                                                                    |
| **Refresh Dev Dataset** (`refresh-dev-dataset.yml`) | manual `workflow_dispatch` only                           | Replaces the `development` Sanity dataset with a fresh, published-only copy of `production` (cross-project export→import — dev and prod are separate Sanity projects). Runs in a dedicated `dataset-refresh` GitHub Environment (needs both projects' credentials at once). Never automatic, never part of a deploy — run manually only after that release's production migrations complete ([#363](https://github.com/ValOvinnikov/blog/issues/363), `docs/DEPLOY.md`'s "Refreshing development from production"). The target dataset name is hardcoded in the script, not env-derived, so a misconfigured environment can't reverse the copy direction. |

**Required status checks on `main`:** Type-check, Lint, Test, Typegen, Build,
Migrations, and Dependency Review, plus five checks promoted by
[#462](https://github.com/ValOvinnikov/blog/issues/462) — Zizmor,
Actionlint, Knip, Commitlint, and Hooks (`Shellcheck + guard tests`).
Everything else (Test Presence, Claude Code Review, Claude Code, Lighthouse
CI, Playwright smoke) stays advisory: a red result there does not currently
block a merge. Required workflows run on every PR without path filters on
purpose — a path-skipped workflow leaves its required checks pending forever
(see the comment in `ci.yml`).

**Lighthouse CI and Playwright smoke stay advisory by design**
([#450](https://github.com/ValOvinnikov/blog/pull/450)) — both depend on a
preview/smoke URL this repo doesn't produce yet (no PR preview deploys, per
SPEC §13). Promoting either to a required check is a deliberate follow-up
once `LIGHTHOUSE_URLS`/`SMOKE_URL` are actually configured and the checks
can genuinely fail, not before — a required check that's structurally unable
to fail yet isn't a real gate.

**Test Presence stays advisory by design.** Refactors, type-only changes, and
pure re-exports legitimately carry no test delta, so the job nudges rather than
blocks — don't add it to the required checks. When a change genuinely needs no
test, apply the `no-tests-needed` label: the override then lives on the PR
where reviewers can see it, instead of in a bypassed check. This decision
predates #462 and #462 did not reopen it — `claude.yml`'s required/advisory
status was the one genuinely open question in
[#462](https://github.com/ValOvinnikov/blog/issues/462), decided as
advisory (see the table row above).

One-time environment setup (datasets, tokens, Vercel projects, secrets,
webhooks, CORS) is human-gated console work — see [`docs/DEPLOY.md`](./docs/DEPLOY.md)
and `SPEC.md` §13. Manual `sanity deploy` / Vercel deploys are never run by
hand (agent permissions deny them; the pipeline owns deploys).

## License

Private project — all rights reserved.
