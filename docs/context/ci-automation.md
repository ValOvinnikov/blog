# CI & automation

> Part of the docs split described in [`docs/README.md`](../README.md).

All automation lives in `.github/workflows/` (shared pnpm/Node setup in
`.github/actions/setup`; Dependabot bumps npm + GitHub Actions weekly).
`.github/actions/setup` takes an optional `install-filter` input (default
empty, meaning an unscoped `pnpm install --frozen-lockfile` across every
workspace). When set, its value is split on whitespace into one `--filter=`
argument each, so a caller may name more than one workspace root. Five
workflows set it, all of them jobs that dispatch a single `@blog/db` script
and have no use for `apps/web`/`apps/platform`/Storybook/Playwright's
dependency trees:

| Workflow                  | Filter                        |
| ------------------------- | ----------------------------- |
| Deprovision Tenant        | `@blog/db...`                 |
| Recheck Tenant Owners     | `@blog/db...`                 |
| Invalidate Tenant Cache   | `@blog/db...`                 |
| Validate Tenant Documents | `@blog/db... @blog/studio...` |
| Migrate Tenant Content    | `@blog/db... @blog/studio...` |

The last two need the second filter because their `@blog/db` scripts shell out
to the Sanity CLI (`pnpm exec sanity documents validate` / `documents query`)
and to `node scripts/migrate.mjs` with `packages/studio` as the cwd. Scoping
those two to `@blog/db...` alone installs no `packages/studio/node_modules`
and the run dies on `Command "sanity" not found` — so check what a script
actually executes before narrowing a workflow's filter.

Measured on one machine against a warm pnpm store, this is worth roughly two
thirds of the install for a db-only job and roughly a third for a db+studio
one: 49.4s/1.3G unscoped, 16.0s/422M for `@blog/db...`, 31.1s/803M for
`@blog/db... @blog/studio...`. A filtered install still processes the
workspace root, so the root's `preinstall` (`guard-worktree-install.mjs`) and
`prepare` (husky) lifecycle scripts run exactly as they do unscoped.

**The pinned pnpm binary is cached, and that is load-bearing.**
`pnpm/action-setup`'s self-installer shells out to `npm install pnpm@<version>`,
and that single-package install has been observed taking upwards of seven
minutes on hosted runners — roughly thirty-five times longer than installing
this entire monorepo. Every job that sets up pnpm pays it independently, so a
slow npm registry surfaces as cancelled required checks on PRs whose diffs are
fine. `.github/actions/setup` therefore restores `~/setup-pnpm` from an
`actions/cache` entry keyed on `runner.os`/`runner.arch`/the pinned pnpm
version, and only runs `pnpm/action-setup` when that cache does not yield a
working binary of exactly the pinned version. One cold install is paid per pnpm
bump; every other job restores in seconds. Two consequences worth knowing:
a cache written on a feature branch is not visible to other branches, so the
first run after a pnpm bump pays the cold cost until `main` writes the entry
for everyone; and a restored-but-broken entry falls through to the installer
rather than failing the job, which is what the explicit version check in the
composite action is for.

**Timeout policy.** A job that uses `.github/actions/setup` gets at least
`timeout-minutes: 15`, because it pays a fixed dependency-setup cost on top of
its own work; jobs whose work genuinely takes longer (the deploy,
dataset and content-migration jobs) keep their larger budgets. A job that
installs nothing — Workflow security, Dependency scan, Board auto-sync,
and the `changes` path-filter jobs — gets `timeout-minutes: 5`. Every job
carries an explicit budget except those that call a reusable workflow, where
GitHub does not permit the key. Before this policy the budgets ranged from 5 to
15 with no stated relationship to that fixed cost, so whether a job survived
depended on which budget it happened to carry rather than on its own work: a
5-minute job was cancelled four consecutive times on a PR whose other 21 checks
were green. That job was Commitlint, since retired in favour of the
`.husky/commit-msg` hook — the floor is what stops the next short-budget job
repeating it.

**This table is a Prettier-driven merge-conflict hotspot.** Prettier repads
every column to its widest cell whenever any row's content changes width, so
two PRs that each edit a different row — merged in either order — conflict on
every other row even though their actual edits never overlap. Don't hand-align
the table to route around this; that fights Prettier instead of working with
it. To resolve: `git checkout <base> -- docs/context/ci-automation.md` (take
the base branch's file wholesale, discarding the conflict), re-apply only your
own sentence-level edit on top, run
`pnpm exec prettier --write docs/context/ci-automation.md` to repad, then
re-stage.

| Workflow                                                            | Trigger                                                                                                                                                            | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CI** (`ci.yml`)                                                   | every PR (any base); jobs skip on drafts and run on `ready_for_review`; `workflow_call` (`full`) from Full gate                                                    | The quality gates: **Changes** (no install; diffs the PR against its base and sets the path outputs later jobs gate on — see "Path outputs" below), **Verify** (one install, then one step per check, each running even when an earlier one failed so one run reports every failure — see "The Verify job" below), **Test**, **Migrations** (loads every migration + read-only dry-run against the dataset), **Required env** (runs `scripts/check-required-env.mjs` once per deployment environment as a matrix — see "Required env vars" below). The **CI** job `needs:` every other job in the file and runs even when one fails (`if: ${{ !cancelled() }}`); it fails when any needed job failed or was cancelled, and counts a job skipped by its own `if:` as passed. `CI` is the required status check, not the jobs it gathers, so a job can be renamed, merged or path-gated without touching the ruleset.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Full gate** (`full-gate.yml`)                                     | manual `workflow_dispatch` + `workflow_call`                                                                                                                       | Runs every gate on one commit with no pull request, for a release tag: calls `ci.yml` with `full: true` and `secrets: inherit`, `workflow-security.yml`, and `dependency-scan.yml` with `full: true`, then a **Full gate** job that fails unless all three succeeded — see "The full gate" below.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Dependency scan** (`dependency-scan.yml`)                         | PRs that change a `package.json` or `pnpm-lock.yaml` (any base); `workflow_call` (`full`) from Full gate                                                           | Advisory. Runs osv-scanner over the base and head `pnpm-lock.yaml` and fails on any high or critical advisory the head adds; advisories already on the base do not fail it. With `full` there is no base to compare, so it scans the head lockfile alone and fails on any high or critical advisory in it. Stands in for Dependency Review, which needs GitHub Code Security on a private repo.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Knip** (`ci.yml`)                                                 | every PR (any base)                                                                                                                                                | Reports unused files, exports, and dependencies (config in `knip.json`); read-only, fails on any finding or a stale ignore rule. A step of **Verify**, gated through `CI`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Workflow security** (`workflow-security.yml`)                     | every PR (any base); `workflow_call` from Full gate                                                                                                                | One job, `Workflow security`: zizmor's static security analysis of the workflow files (accepted findings carry an inline `# zizmor: ignore[...]`); actionlint over their syntax, `${{ }}` expressions, `needs` graph and `run:` blocks, from the official binary pinned by version + sha256; shellcheck over `.claude/hooks/*.sh` and `scripts/*.sh`, which actionlint never reaches; then every `.claude/hooks/*.test.sh` guard matrix and `scripts/vercel-ignore-affected.test.sh`. It lives apart from `ci.yml` so a PR cannot switch these scans off by editing `ci.yml`, and deleting or disabling this workflow leaves its required context unreported, so the PR stays blocked. Required status check.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Claude Code** (`claude.yml`)                                      | `@claude` mentions (owner-only, owner-authored threads)                                                                                                            | Interactive agent runs on issues/PRs. Decided advisory — it's a Claude-driven review/automation workflow, not a deterministic lint/type/test gate, so a transient failure there shouldn't block every merge. Passes `secrets.GH_PAT` into the step as the `GITHUB_PAT` env var, which is what `.mcp.json`'s `Bearer ${GITHUB_PAT}` header resolves to — without it the github MCP server 400s on a malformed Authorization header and every `mcp__github__*` tool is silently unavailable for the run. The secret cannot be called `GITHUB_PAT`: GitHub rejects Actions secret names starting with `GITHUB_`. It holds a classic PAT scoped `repo` + `project` — `repo`, not `public_repo`, so it can read a private repository; the MCP server exposes no Projects v2 tools, so board writes generally go through `gh api graphql` rather than MCP, independent of this secret. `claude_args` also carries an `--append-system-prompt` (combines with the SDK's default system prompt, the `claude_code` preset, rather than replacing it — distinct from the unused `prompt:` input, which would replace the dynamically-derived task content instead) telling the run to push and open its own PR via `gh pr create` in the same pass — without it, a run's default is to push a branch and leave a "Create PR" link for a human to click instead of opening one itself.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Deploy Development** (`deploy-development.yml`)                   | **manual dispatch only** (the `push` to `main` trigger is temporarily commented out — see "Deployments are temporarily manual" below)                              | `turbo-ignore` change detection, anchored to the last commit the workflow completed successfully against rather than `HEAD^1`, so a cancelled run's changes are picked up by the run that superseded it (see "A cancelled dev deploy is not a lost deploy" below) → verify (type-check/lint/test/build; Test is skipped when the commit already passed the Full gate, or is the merge commit of a PR whose identical-tree head passed CI's Test job — see "Dev Verify skips tests that already passed on the same tree" below) → auto-apply pending content migrations to the dev dataset → auto-apply pending `@blog/db` (Drizzle/Neon) schema migrations to the dev Neon branch (`migrate-db` job; `deploy-web` and `deploy-admin` depend on it) → deploy only the affected app(s) — web and/or admin panel — to the dev environment. The Sanity `migrate` job stays gated on the studio/web pair rather than on `verify`'s wider condition, so an admin-only merge doesn't run a content migration for an app that never touches Sanity. `migrate-db` opens with a guard step comparing its resolved connection host against the repo Variable `PRODUCTION_DB_HOST` and fails the job loudly on a match. `PRODUCTION_DB_HOST` must hold a **bare hostname only** (e.g. `ep-xxxx.us-east-2.aws.neon.tech`) — never a full `postgresql://` connection string; the guard also fails the job (not silently skips) if the Variable is unset or doesn't look like a bare hostname (`docs/DEPLOY.md`'s "Repo level — production-target guard for `migrate-db` (both directions)"). Every secret and Variable either migration or deploy job needs is asserted with a `:?` guard **inside** the step rather than an `if:` **on** the step (#2734, extending #2499's production-side change): `SANITY_MIGRATE_TOKEN`, `DATABASE_URL_UNPOOLED`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and the per-app project id. A skipped step reports green, so an unset value used to leave an inert-but-green job that still satisfied the deploy jobs' `needs`; now the run fails and names the missing secret.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Deploy Production** (`deploy-production.yml`)                     | `vX.Y.Z` tag push + `workflow_call` (`tag`)                                                                                                                        | Full gate on the tag (calls `full-gate.yml` with `ref`, secrets inherited) → on a tag push, the console content migration (`migrate-production-content.yml`) and the database migration (`migrate-production-database.yml`) → deploy web + admin panel to production. On the callable path `release.yml` has already run every migration, so both migration calls are skipped and the deploy jobs check out `tag`; each deploy job's `if:` accepts a skipped migration only when `tag` is set, so anything short of success blocks the deploy on a tag push. `deploy-web` and `deploy-admin` assert **every** Vercel value they need (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID_WEB` / `VERCEL_PROJECT_ID_PLATFORM`) with a `:?` guard inside the deploy step, never with an `if:` on the step, because a skipped step reports green.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Release** (`release.yml`)                                         | manual `workflow_dispatch` (`version`, `sha`, `override`), from the platform's Releases page                                                                       | Cuts a production release of exactly `sha`, never `main`'s HEAD at dispatch time. **Validate** refuses a dispatch on any ref but `main`, a `version` that is not `vX.Y.Z` or not greater than the latest `v*` tag, and a missing `sha` or one not on `main`, all before the gate. Then: **Full gate** on `sha` → **Migrate prod database** (`migrate-production-database.yml`, with its `pg_dump` backup) → **Migrate prod content** for the console project (`migrate-production-content.yml`, with its dataset export) alongside **Migrate tenant content** for every active tenant (`migrate-tenant-content.yml`, environment `production`, per-tenant export and ledger) → **Tag release** creates `version` on `sha` through the API (`contents: write` on this job only) → **Deploy production** calls `deploy-production.yml` with the tag. Every job needs the one before it, so a failed gate or tenant migration creates no tag and deploys nothing, and the previous deployment keeps serving. A tag created with `GITHUB_TOKEN` triggers no workflow, which is why this calls the deploy itself. The run name is `Release <version>`, so the platform can find it. `override` records an audited contrast override in the run summary and changes nothing else. `concurrency: release` with no cancel-in-progress queues a second dispatch behind the first; GitHub keeps one pending run, so a third replaces the pending one. The `production` Environment has no protection rules, so the Release button is the only human gate. Back up the production datasets by hand before the first run.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Migrate Production Content** (`migrate-production-content.yml`)   | `workflow_call` (`ref`, `label`)                                                                                                                                   | The console project's content migration for both production callers: export the `production` dataset to a `sanity-prod-backup-<label>` artifact, then `migrate:deploy --yes`. A missing `SANITY_MIGRATE_TOKEN` fails the job inside its steps rather than leaving an inert-but-green job.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Migrate Production Database** (`migrate-production-database.yml`) | `workflow_call` (`ref`, `label`)                                                                                                                                   | The `@blog/db` migration for both production callers. It fails unless `DATABASE_URL_UNPOOLED` resolves to the repo Variable `PRODUCTION_DB_HOST` (the mirror image of the dev guard), then `pg_dump`s to a `db-prod-backup-<label>` artifact with a PGDG v17 client, then runs `db:migrate`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Lighthouse CI** (`lighthouse.yml`)                                | push to `main` (+ manual dispatch)                                                                                                                                 | Advisory Lighthouse CI budget assertions (performance ≥ 90, accessibility ≥ 95, best-practices ≥ 90, SEO ≥ 95 — `.lighthouse/budgets.json`, documented in `.lighthouse/README.md`) against **production** for `/` and one post page — not a per-PR preview (none exists or is currently tracked, `SPEC.md` §13); `development` was tried first but is unsuitable (deliberately `noindex`, plus cold-start noise), so this checks production's current health on every merge rather than that merge's own diff, until a true per-PR preview target exists. Moved off every-PR-push to merge-to-main-only — it was a structural no-op on PRs anyway. Guarded on the repo Variable `LIGHTHOUSE_URLS`; no-ops green if unset.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Playwright smoke** (`playwright-smoke.yml`)                       | manual `workflow_dispatch` only                                                                                                                                    | Minimal e2e smoke suite (`apps/web/e2e/`): home page and one post-detail page (discovered dynamically from a live link, no hardcoded slug) each render 200 with zero console errors, run against `SMOKE_URL`. **Currently a no-op green** for the same reason as Lighthouse CI above — no PR preview deploys yet, and no per-PR preview mechanism is currently tracked, so the job is guarded on the repo Variable `SMOKE_URL`. Dispatch-only: a push to `main` starts no run, because with `SMOKE_URL` unset every run was a billed no-op.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Contrast** (`contrast.yml`)                                       | manual `workflow_dispatch` only, on the branch or tag picked at dispatch                                                                                           | Renders every `apps/web` module story in each brand variant, theme, mode and width and fails on a contrast regression against `apps/web/contrast/baseline.json` — see "The rendered contrast job" below. Builds Storybook once and shares it across four shards, then a `Report to the platform` job posts the outcome to `apps/platform` — see "The rendered contrast job". Dispatched from the platform Releases page; never runs on a PR and is not a required check.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Refresh Dev Dataset** (`refresh-dev-dataset.yml`)                 | manual `workflow_dispatch` only                                                                                                                                    | Replaces the `development` Sanity dataset with a fresh, published-only copy of `production` (cross-project export→import — dev and prod are separate Sanity projects). Runs in a dedicated `dataset-refresh` GitHub Environment (needs both projects' credentials at once). Never automatic, never part of a deploy — run manually only after that release's production migrations complete (see `docs/DEPLOY.md`'s "Refreshing development from production"). The target dataset name is hardcoded in the script, not env-derived, so a misconfigured environment can't reverse the copy direction.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Deprovision Tenant** (`deprovision-tenant.yml`)                   | manual `workflow_dispatch` only                                                                                                                                    | Reverses provisioning for one tenant: removes its custom domain from the shared `apps/web` Vercel project, archives its Sanity project by setting `isDisabledByUser` — which stops its subscription and blocks API/CDN access, and unlike deleting a project does not require an org billing permission this token deliberately lacks, so the project and its dataset survive for a later permanent tenant delete — clears the persisted Sanity credentials and other provisioning-artifact columns on the `tenants` row, then archives the row by stamping `deprovisionedAt` — never a hard delete, so the tenant's history and audit trail survive teardown. Its domain stays claimed in `tenant_domains` too; only a permanent tenant delete cascades that row away and frees the domain for reuse. Finally it POSTs the archived tenant's id to `apps/web`'s `/api/revalidate-site-config`, purging that tenant's cache tags so the archived site stops being served from the prerender cache instead of waiting out its fallback window; this step needs `vars.WEB_APP_URL` and `secrets.SITE_CONFIG_REVALIDATE_SECRET` from the same Environment, and — unlike every other credential the job reads — they are deliberately **not** validated up front, so a missing value can never block the destructive teardown steps that precede it. It is also the one step that is **not** idempotent-on-retry: the run-level `deprovisionedAt` guard short-circuits an already-archived tenant, so a re-run dispatched specifically to retry a failed invalidation returns "already deprovisioned" without reaching it — recovering from that failure means dispatching **Invalidate Tenant Cache** (`invalidate-tenant-cache.yml`, below) instead, which re-runs only this one step against the tenant id and is unaffected by the `deprovisionedAt` guard. Destructive, so two safety gates apply before any deletion: a `confirm` input that must match the tenant's live name exactly, and a `dryRun` input defaulting to `true` (an operator must explicitly set it to `false` to delete anything). Runs in the GitHub Environment named by the required `environment` input — every credential the job needs, including the tenant registry connection string (`secrets.TENANT_REGISTRY_DATABASE_URL`), resolves from that same Environment. Every step is independently idempotent (404-tolerant deletes, column-presence checks) — a retry after a partial failure resumes safely. Archiving also records one `DEPROVISIONED`/`TENANT` row in `audit_events` — the outcome half of the pair the platform app opens with `DEPROVISION_REQUESTED` when it dispatches this workflow — attributed to the dispatching GitHub user (`actor_id` `github:<login>`) from the `GITHUB_ACTOR`/`GITHUB_RUN_ID` defaults Actions sets on every step — a dry run or an already-archived tenant records nothing, and a failed audit write is logged and swallowed rather than failing the step whose destructive work already succeeded. Logic lives in `packages/db/scripts/deprovision-tenant/`, run with `tsx`. |
| **Invalidate Tenant Cache** (`invalidate-tenant-cache.yml`)         | manual `workflow_dispatch` only                                                                                                                                    | Retries just Deprovision Tenant's final step for one tenant id — POSTs it to `apps/web`'s `/api/revalidate-site-config` to purge its cached pages, without touching any domain, Sanity project, token, or the `tenants` row itself. This is the recovery path for a failed invalidation the Deprovision Tenant row above describes: the `deprovisionedAt` guard blocks a normal re-dispatch of that workflow from ever reaching the step again once the tenant is archived, so this workflow calls it directly instead, independent of that guard. Safe against both an already-archived and a still-active tenant, and safe to run repeatedly — the endpoint only purges cache tags, so no `confirm`/`dryRun` gate is needed. Runs in the GitHub Environment named by the required `environment` input, same as Deprovision Tenant, resolving the tenant registry connection string and `WEB_APP_URL`/`SITE_CONFIG_REVALIDATE_SECRET` from that Environment; fails loudly, before any network call, if either is absent. Logic lives in `packages/db/scripts/invalidate-tenant-cache/`, which calls the same `invalidateTenantCache` step function `deprovision-tenant/` uses.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Recheck Tenant Owners** (`recheck-tenant-owners.yml`)             | **cron parked** (`0 */6 * * *` commented out, #3479) — manual `workflow_dispatch` only until `TENANT_REGISTRY_DATABASE_URL` exists in the `production` Environment | Sweeps every fully core-provisioned, active tenant (`status = ACTIVE`, `provisioningStatus = READY`) and re-checks its Sanity project ACL, promoting the owner from `viewer` to `administrator` once they've accepted their invite (`elevateTenantOwner`). The 6-hour cadence gives ~12 checks within `elevateTenantOwner`'s existing 3-day stall threshold (`OWNER_ACCEPTANCE_STALL_THRESHOLD_MS`) — good resolution for surfacing a stall promptly, while also elevating a genuinely-accepted owner within hours rather than up to a day later. One candidate's failure never aborts the sweep for the rest (per-tenant try/catch), and re-checking a settled (already-`administrator`) owner is a cheap no-op single ACL read — repeated checks stay cheap even for a tenant that never accepts. Needs only `SANITY_MANAGEMENT_TOKEN` and the tenant registry connection string — no Vercel credentials, this workflow never touches Vercel. Like Deprovision Tenant, its job binds its GitHub Environment to its own optional `environment` input (`development`/`production`, default `production`), so the registry connection string and every other credential resolve from the Environment that dispatch names rather than a fixed one. Unlike those two it also runs on a `schedule:`, and a scheduled run carries no `inputs` context at all, so it binds that input with a `'production'` fallback: every cron sweep targets `production`, and only a manual dispatch reaches `development`. Logic lives in `packages/db/scripts/recheck-tenant-owners/`, same execution pattern as `deprovision-tenant/`. Each check's outcome is persisted to the tenant's `OWNER_ELEVATION` provisioning step (`reportOwnerElevationOutcome`), so the platform admin panel can render it. The job's `PLATFORM_APP_BASE_URL`/`OPERATOR_ALERT_SECRET` (both optional) POST an operator-alert event to `apps/platform`'s `/api/internal/operator-alert` endpoint, via the `notifyOwnerElevationOutcome` helper (`packages/db/scripts/recheck-tenant-owners/lib/notify-owner-elevation-outcome.ts`), when a tenant's outcome is `STALLED`/`AMBIGUOUS_MEMBERSHIP` — the platform app resolves every `ADMIN_ROLE.SUPERADMIN` admin and sends the email. De-duplication keys on the `tenants.lastNotifiedOwnerElevationOutcome` column — the outcome last actually communicated, written by this same helper right after a successful send — rather than the most recently _observed_ outcome, so a same-day sweep never re-sends for an outcome unchanged since the last notification, whether that notification happened on an earlier sweep or in the worker's owner-access checks. Either unset skips only the notification, never the sweep itself (`notifyOperatorsOfOwnerElevationOutcome`).                                                                                                                                                                                                                                                                                                                |
| **Validate Tenant Documents** (`validate-tenant-documents.yml`)     | **cron parked** (`0 6 * * 1` commented out, #3479) — manual `workflow_dispatch` only until `TENANT_REGISTRY_DATABASE_URL` exists in the `production` Environment   | Runs `sanity documents validate` (read-only) against every `status = ACTIVE`, non-deprovisioned tenant's own Sanity project/dataset — the console reference project is validated separately by `document-validation.yml`, which this workflow never touches. Each per-tenant CLI invocation overrides `SANITY_STUDIO_PROJECT_ID`/`SANITY_STUDIO_DATASET`/`SANITY_AUTH_TOKEN` (the tenant's own persisted **read** token, decrypted via `getTenantSanityCredentials` — no write credential is used or needed), following the same env-override shape `refresh-dev-dataset.mjs` uses for its cross-project export/import, since `packages/studio/sanity.cli.ts` resolves those vars at config-load time before any CLI flag is parsed. Always advisory: this job's own exit code reflects only a systemic failure (the CLI/network failing, or a findings-store write failing) — an expected outcome (some/all documents invalid) is reported, never treated as a failure, so a tenant seeded already-invalid by `starter-content.ts` is surfaced, not blocked. One tenant's failure never aborts the sweep for the rest (per-tenant try/catch, `packages/db/scripts/validate-tenant-documents/run.ts`). Every invalid-document result is persisted as one `findings` row per tenant (`source: DOCUMENT_VALIDATION`, `kind: SCHEMA_VALIDATION_ERROR`) via `db.queries.findings.openFinding`, rendered on that tenant's detail page and the platform-wide findings list in `apps/platform` — no dedicated migration or admin-panel work was needed, since the shared findings store already existed. A clean re-validation resolves any previously open finding for that tenant (`resolveFinding`). The optional `PLATFORM_APP_BASE_URL`/`OPERATOR_ALERT_SECRET` job env vars POST an operator-alert event to `apps/platform`'s `/api/internal/operator-alert` endpoint, via `packages/db/scripts/validate-tenant-documents/lib/notify-operators.ts`, only on `openFinding`'s `isNewlyOpened: true` — a tenant's first transition into a failing state — never on a sweep that finds the same tenant still failing, so a known-bad tenant doesn't re-spam every run; the platform app resolves every `ADMIN_ROLE.SUPERADMIN` admin and sends the email. Two triggers: the weekly cron (every in-scope tenant) and a manual `workflow_dispatch` optionally scoped to one tenant via a `tenantId` input (blank sweeps every in-scope tenant). Like the other tenant-lifecycle workflows, its job binds its GitHub Environment to `${{ inputs.environment \|\| 'production' }}` — the `\|\| 'production'` fallback is load-bearing for the cron trigger, whose `inputs` context is null. Needs only the tenant registry connection string and `TENANT_TOKEN_ENCRYPTION_KEY` — no `SANITY_MANAGEMENT_TOKEN`, unlike Provision Tenant/Recheck Tenant Owners, since this workflow only ever reads via each tenant's own already-persisted token.                                                                                                                                                                    |
| **Document Validation** (`document-validation.yml`)                 | manual `workflow_dispatch` + `workflow_call` — no schedule                                                                                                         | Runs `sanity documents validate --yes` (read-only) against the console reference project's dataset — every existing document checked against the current Studio schema. Same repo-level `SANITY_STUDIO_PROJECT_ID`/`SANITY_STUDIO_DATASET` Variables and `SANITY_API_READ_TOKEN` secret as `ci.yml`'s Migrations dry-run step, but unlike that step it never no-ops: a missing token fails the run with an error naming `SANITY_API_READ_TOKEN`, so a green run always means documents were validated. `workflow_call` is the hook the platform Releases page uses to run it before a release; the secret is `required: true`, so a caller must pass `SANITY_API_READ_TOKEN` (or `secrets: inherit`) and grant `contents: read` + `issues: write`. On failure a second job opens one tracking issue titled "Document validation is failing" (`bug`, `prio:next` — filed unlabelled if either label is missing; its text names the missing secret when that was the cause), or comments the run link on it while it stays open. Advisory by nature — see "Document validation moved off the per-PR run" below — and deliberately absent from the branch ruleset's required checks. Tenant datasets are the separate Validate Tenant Documents workflow below.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Migrate Tenant Content** (`migrate-tenant-content.yml`)           | push to `main` (dev only, gated on the studio/web change pair) + manual `workflow_dispatch` + `workflow_call`                                                      | Applies pending Sanity **content** migrations to every `status = ACTIVE`, non-deprovisioned tenant's own Sanity project. Logic lives in `packages/db/scripts/migrate-tenant-content/`, not the workflow YAML. Each tenant's `migrate.mjs deploy --yes` runs with `SANITY_STUDIO_PROJECT_ID`/`SANITY_STUDIO_DATASET`/`SANITY_AUTH_TOKEN` overridden to that tenant's own decrypted **write** token (`getTenantSanityWriteCredentials`), so blast radius stays one tenant per credential. **Empty-ledger tenants are backfilled, never replayed** (`isTenantMigrationLedgerEmpty` → `--backfill`), because they were seeded at the then-current schema. The per-dataset `migrationState` ledger makes every run idempotent, so a retried release skips a tenant whose migrations are already applied. One tenant's failure never aborts the sweep, but any failure fails the job. **A production run exports each tenant dataset just before migrating it** (`TENANT_EXPORT_DIR`; a failed export counts as that tenant's failure and it is not migrated) and uploads the exports as one `tenant-content-exports-<run>-<attempt>` artifact, even when a tenant failed. This interim export is replaced by the daily tenant backups (#5095). A dev push exports nothing. `workflow_dispatch` and `workflow_call` take an optional `tenantId` (blank migrates every tenant) and `environment`; `workflow_call` also takes `ref`, the commit whose migrations run. `release.yml` is the production caller; there is no tag trigger. The `Detect changes` job cancels only an older push's detection, never a release's.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

| **Board Auto-Sync** (`board-auto-sync.yml`) | `create` (branch) + `pull_request` (opened, reopened) | Turns cloud-session branch/PR evidence into board status writes, closing the gap in `CLAUDE.md`'s cloud-session protocol where status otherwise waits on a local session dispatching `board-keeper`. A pushed branch matching `<type>/<n>-<slug>`, the legacy `issue/<n>-*` form, or the GitHub Actions `@claude` cloud shape `claude/issue-<n>-<timestamp>` moves issue `#n` to **In Progress**; an opened/reopened PR whose body carries `Closes #n`/`Fixes #n`/`Resolves #n` (falling back to the branch name) moves it to **Code Review**; either move also takes the issue's parent from Todo to **In Progress**, the way `board-keeper` promotes a parent when any sub-issue starts — all forward-only, mirroring `board-keeper.md` Step 4's safe-transition list, and both re-verified with an independent read after the write (the same Projects v2 silent-write-failure mode `board-keeper.md` documents). Shared logic lives in `.github/scripts/sync-board-status.sh`. Uses the `GH_PAT` secret (see the Claude Code row above) since the default `GITHUB_TOKEN` cannot write Projects v2; the workflow fails loudly, before any API call, if that secret is absent. Gated to the owner as `github.actor`, or `claude[bot]` as the branch's creator (`github.event.sender.login`) or the PR's author (`github.event.pull_request.user.login`) — zizmor rejects a `github.actor` bot check as spoofable — same posture as `claude.yml` (which only runs `claude[bot]` for the owner, so the `@claude` runner's own branches and PRs count) — without it, a PR body's `Closes #n` is attacker-controllable input any contributor to this repo could use to move an arbitrary issue on the board. |

**Required status checks on `main`:** `CI` and `Workflow security`, and no
other. Every job in `ci.yml` reaches the merge gate through `CI`.

**Drafts skip the gate.** Every `ci.yml` job but `CI` carries
`if: ${{ !github.event.pull_request.draft }}`, so a push to a draft PR runs
only `CI` (green, its needs all skipped) and Workflow security. `ci.yml` also
listens for `ready_for_review`, so marking a draft ready runs the full gate on
its head. A draft cannot merge either way, so the green `CI` never lets
anything through; it only stops a draft from paying for minutes it cannot use.
`gh stack submit` opens drafts by default, so a stack runs its gate when each
PR is marked ready.

**Path outputs.** The `Changes` job checks out full history and diffs the PR
head against its base (merge-base, triple-dot) with no install, setting four
`true`/`false` outputs:

- `full` — anything in `turbo.json`'s `globalDependencies` (`configs/**`,
  `.github/actions/setup/**`, `.nvmrc`, `pnpm-lock.yaml`, `turbo.json`) or a
  root manifest (`package.json`, `pnpm-workspace.yaml`). Verify's Type-check
  and Lint steps and the Test job drop `--affected` when it is set (see "Affected-only runs" below).
- `studio` — `packages/studio/**`, `packages/config/**`, `packages/utils/**` or
  `pnpm-lock.yaml`: @blog/studio's turbo-affected set written out as paths. It
  is wider than `packages/studio/**` on purpose: schemas and migrations import
  `@blog/config`, so a constant changed there alone can stale the generated
  types or break a migration.
- `env-presence` — any `env.ts` or `oauth-env.ts`, or
  `scripts/check-required-env*`.
- `scripts` — anything under `scripts/` (the `.mjs` guards and their tests, and
  the `.sh` scripts and their `.test.sh`) or `.claude/hooks/`.

A docs-only or `apps/web`-only PR sets none. A change to `.github/workflows/ci.yml`
sets every output, so a workflow edit runs every gated job. With no
pull-request base (a tag or a `workflow_call`), or with the `full` input, every
output is set too, so a gated check runs rather than skips and reads as passed.

**The full gate.** A release tag can point at any commit, with no pull request
to have gated it, so `full-gate.yml` runs everything on the exact commit. It
calls `ci.yml` with `full: true`: `Changes` sets every output, no step uses
`--affected`, and `CI` gains an **Every gate ran** step that fails unless
Verify, Test, Typegen, Migrations, the Required env matrix and the Script
helper tests all succeeded — a skip that the pull-request `CI` counts as a pass
is a failure here. Format has no base to diff against and passes with a notice.
It also calls Workflow security, and Dependency scan with `full: true` over the
whole lockfile; its own **Full gate** job fails unless all three calls
succeeded. Secrets are inherited, so the Migrations dry-run and the Required
env matrix see what they see on a pull request. Dispatch it from the Actions
tab on a branch or tag to run it by hand. A caller passes `ref` to gate a
commit other than the one its run was triggered on; `full-gate.yml` hands it to
every checkout in `ci.yml`, Workflow security and Dependency scan. Release
calls it on the dispatched `sha`, and Deploy Production on the tag; each deploy
job requires it to have succeeded, so a failed or skipped gate skips the
release.

**What each output gates.** `studio` gates Verify's Typegen step and the
Migrations job; `env-presence` gates the Required env matrix, which stays its
own job so the environment secrets reach only it; `scripts` gates Verify's
Script helper tests step. A skipped job reads as success to `CI`, which fails
only on a `failure` or `cancelled` need. `Changes` is in `CI`'s `needs`, so a failure there fails
the gate.

**Affected-only runs.** Verify's Type-check and Lint steps and the Test job run
`turbo run <task> --affected` with `TURBO_SCM_BASE` set to the PR's base SHA,
so a PR that changes one package runs that package and its dependents (a
`@blog/ui` change runs `ui`, `web` and `platform`; a `docs/**` change runs
nothing). Three things keep that from running too little:

- `turbo.json` declares `globalDependencies`, and turbo marks every package
  affected when any of them changes, so a root config, setup-action, `.nvmrc`
  or lockfile change runs every task. They also bust every task's cache — the
  price of one rule instead of per-task `inputs` that each had to remember
  which preset they read.
- `full` from `Changes` drops `--affected` for the same paths independently,
  so a root change runs the whole repo even if turbo's own detection misses
  it, and a run with no PR base does the same.
- Verify and Test check out with `fetch-depth: 0`. Turbo needs every commit
  from base to head; on a shallow clone it treats every package as changed,
  which runs more, never less.

`futureFlags.affectedUsingTaskInputs` was trialled and reverted: a README-only
change inside a package still selected `build` (the default inputs include
it), and the flag narrowed `lint` to the changed package alone, dropping its
dependents, which the affected set is meant to include.

**The Verify job.** One checkout and one install, then a step per check.
Every step after setup carries `if: ${{ !cancelled() && steps.setup.outcome == 'success' }}`,
so a failed step does not skip the ones after it and one run reports every
failure; a failed install skips them all rather than failing each one again.
The step names are the job names they replaced, in this order:

- **Format** — `prettier --check --ignore-unknown` over the files the PR added,
  copied, modified or renamed (`git diff --name-only --diff-filter=ACMR`
  against the base, merge-base). Prettier skips what `.prettierignore` names
  even when passed explicitly, so a file the PR did not touch never fails it.
  It catches edits that bypassed lint-staged, such as GitHub web edits and
  Dependabot.
- **Type-check**, **Lint** — turbo, affected-only (above).
- **Knip** — `--treat-config-hints-as-errors`, so a stale ignore rule is red.
- **Client graph** — `scripts/check-client-graph.mjs` fails when a
  `'use client'` module's runtime import graph reaches a module importing
  `server-only`, which fails `next build` under the `react-server` condition
  and which nothing cheaper catches, because every workspace aliases
  `@blog/<pkg>/*` straight to that package's `src/`.
- **Revalidate tags sync** — `scripts/check-revalidate-tags-sync.mjs` fails
  when an `isr(...)` tag literal in `packages/service/src` is missing from
  `apps/web`'s `REVALIDATE_TAGS`, which would purge nothing on publish.
- **Turbo env sync** — `scripts/check-turbo-env-sync.mjs` fails when a var
  declared in an app's (or its packages') `env.ts` is missing from
  `turbo.json`'s `build` `env` allowlist, which strict env mode strips.
- **UI index** — `pnpm gen:ui-index:check`: drift, structure and description
  coverage of `packages/ui/COMPONENTS.md`.
- **Const index** — `pnpm gen:const-index:check`: drift of
  `packages/config/CONSTANTS.md` and `packages/config/const-index.json`, the
  value→const map the touched-file `prefer-shared-constant` rule reads.
- **Required env classification** — `pnpm check:required-env` with no
  environment, which runs only the classification half (see "Required env
  vars" below).
- **Migration index** — `scripts/check-migration-index-collision.mjs` fails
  when a Drizzle migration index in `packages/db/migrations/meta/_journal.json`
  is taken on `main` by a different tag. The job checks out the merge result,
  which has already reconciled the two journals, so the step sets
  `MIGRATION_INDEX_HEAD_REF` to the PR's head SHA and the script reads the
  journal there through `git show`. `origin/main` comes from the
  `fetch-depth: 0` checkout, an authenticated fetch of every branch, so the
  check needs no anonymous fetch and keeps working on a private repository.
  The error names both migrations and points at "Renumbering a migration that
  collides with `main`" in `packages/db/README.md`.
- **Script helper tests** — only when `Changes` sets `scripts`.
  `node --test scripts/*.test.mjs`, the fixture-based suites beside each guard
  script. They import the repo's
  `typescript`, so they need this job's install.
- **Typegen** — only when `Changes` sets `studio`. Regenerates `schema.json`
  and `types.ts` up to three times (typegen is non-deterministic) and fails if
  the committed output in `packages/config/src/sanity/generated/` still
  differs. An `EXIT` trap restores that folder to the committed state however
  the step ends, so Build never compiles regenerated files.
- **Build** — last, after restoring `apps/*/.next/cache` through
  `actions/cache`. Turbo's `build` outputs exclude `.next/cache`, so without
  it a turbo cache miss compiles both apps from nothing. The key is the
  lockfile hash plus a hash of `apps/*/src/**`, so it changes with either; the
  one restore key stops at the lockfile prefix, so no fallback serves a cache
  built against other dependencies. On `pull_request` a cache saves to the
  PR's ref, so later pushes to the same PR reuse it and a new PR starts cold,
  and `actions/cache` saves only when the whole job succeeded.

A pull request that edits `.github/**` can weaken the checks in `ci.yml`
itself — drop a step, loosen an `if:`, or make a job exit 0 — and still go
green, because the ruleset requires no approval. Workflow security is the one
gate such an edit cannot silently disable: removing or disabling
`workflow-security.yml` leaves its required context unreported, so the PR
stays blocked. Read any `.github/**` diff with that in mind.
Everything else (Claude Code, Dependency scan, Document validation, Lighthouse
CI, Playwright smoke) stays advisory: a red result there does not currently
block a merge.
The ruleset carries no `code_scanning` or `code_quality` rule and CodeQL's
default setup is off: without GitHub Code Security a private repository
produces no code-scanning results, so either rule would block every merge.
Required workflows run on every PR without path filters **and without
base-branch filters**, on purpose — a workflow skipped by either leaves its
required checks pending forever, so it blocks the PR instead of reporting on
it (see the comment in `ci.yml`).

**The base-branch half of that is what makes stacked PRs viable.** Every
workflow above that carries a required check — `ci.yml` and
`workflow-security.yml` — declares a bare `pull_request:` trigger, so a PR
opened against any branch (the normal shape of a stacked PR) still reports
both. A
`branches: [main]` filter here would strand such a PR permanently: it would
run none of the required jobs, and retargeting would not rescue it either,
since GitHub's retarget on base merge fires `edited`, which neither workflow
listens for.

**If you are tempted to narrow these triggers again, note the scope trap:**
the scoping is declared independently in each of the two workflow files, so
touching only `ci.yml` moves `CI` and leaves a PR just as blocked on Workflow
security. Both change together or not at all.
The cost of the current setting is that the full suite runs against arbitrary
base branches; that is compute only, since these are `pull_request` triggers
rather than `pull_request_target` and the base branch does not change what
permissions or secrets a run receives.

**Document validation moved off the per-PR run** (#3357). It was a separate,
advisory job inside `ci.yml` — kept apart from the required Migrations job
precisely so a routine drift in an existing live document (independent of
any given PR's diff) can't fail a required check, the same reasoning as
Lighthouse CI / Playwright smoke below. Advisory or not, a red job fails the
run: it accounted for 113 of the last 150 failed `ci.yml` runs, so
`ci-watcher` reported a failure and the orchestrator triaged a known-red
check on nearly every PR. The same read-only `sanity documents validate`
step now runs from `document-validation.yml` (table above) and stays out of
the branch ruleset; `ci.yml` no longer contains it. It has no schedule:
content drifts without a commit, so it runs on dispatch and when a release
is prepared, which catches the same drift when it matters (#5267).

**Document validation fails on content, not code.** The CLI exits 1 when any
document in the console dataset carries a schema error; warnings never fail
the run. Hand-edited QA documents drift out of validity as the schema
tightens, so a red run is a content ticket (fix the named documents in
Studio), not a workflow change — read the failing step's output for the
document IDs and field paths.

**`migrationState` validates cleanly.** `migrationState` (`packages/studio/scripts/migrate.mjs`'s single fixed-`_id`
migration ledger document) has a declared Studio schema type
(`packages/studio/src/schema-types/documents/system/migration-state.ts`) so
`sanity documents validate` recognizes it, while `sanity.config.ts` disables
every Studio document action and excludes it from the new-document menu —
it's still never edited via the Studio UI. This supersedes an earlier
decision (#1580) to leave it unrecognized as an accepted warning; #1882
revisited that call and declared the type instead, since the job being
advisory doesn't make an avoidable warning worth carrying indefinitely.

**The Test job caps turbo at two suites at a time** (#3364):
`pnpm turbo run test --affected --concurrency=2`, in the workflow only — the root
`pnpm test` script and `turbo.json` keep turbo's default of 10, so local runs
are unchanged. At the default, every workspace's vitest spawns its own worker
pool at once and the runner is oversubscribed: the symptom is a hook or test
timeout in whichever heavy suite (`@blog/db`'s per-file PGlite setup, `web`,
`platform`, `@blog/studio`) lost the scheduling race, and the failure set
changes between otherwise identical runs, which is the tell that it is
contention rather than code. 13 of the last 150 failed `Test` runs were of
that class, and the same suites pass when rerun standalone. Measured locally on
an 8-core machine with `--force` (cache bypassed): default concurrency
8m55s wall, `--concurrency=2` 7m08s, `--concurrency=50%` (4 there; 2 on
`ubuntu-latest`'s 4 vCPUs) 7m07s — the cap costs no wall time because the
big four suites stop contending and each finish in under half the time.
`2` rather than `50%` because it resolves to the same number on the hosted
runner and a literal does not silently change with the runner size. Note
the flag sits on `turbo run` directly: pnpm forwards `pnpm test --
--concurrency=2` verbatim, so the `--` would hand the flag to vitest, not
turbo. The ticket's acceptance criterion — ten consecutive `Test` runs on an
unchanged branch with no timeout-class failure — is observable only on CI
after merge, so it is the thing to watch, not something this change proved.

**Lighthouse CI and Playwright smoke stay advisory by design, and neither
runs on a PR push.** Playwright smoke is dispatch-only: it depends on a
preview/smoke URL this repo doesn't produce yet (no PR preview deploys, per
`SPEC.md` §13), so a push-triggered run was a billed no-op. Restoring a
`push` trigger and promoting it stay a deliberate follow-up once `SMOKE_URL`
is configured and it can genuinely fail. Lighthouse CI runs on push to
`main`; it targets production and **can** genuinely fail
— it stays advisory anyway because it checks production's current health
rather than the merge's own diff (no per-PR preview target exists or is
currently tracked), which makes a blocking failure there potentially
unrelated to the change that triggered it. It was moved off every-PR-push
to merge-to-main-only: it never gated on the PR's own
diff (same production/live-URL target regardless of which PR pushed), so a
PR-push trigger only paid the run cost without adding signal a post-merge
run doesn't already give.

**Dev Verify skips tests that already passed on the same tree.** Before its
Test step, Deploy Development's `verify` job's "Already tested?" step asks the
GitHub API, in order:

1. Is there a successful `workflow_dispatch` run of `full-gate.yml` whose
   `head_sha` is the commit being deployed? Only a dispatched run qualifies:
   the dispatch declares no `ref` input and always gates its own `head_sha`,
   whereas a `workflow_call` run may have gated another ref.
2. Otherwise, is the commit a merged PR's `merge_commit_sha`, and does that
   PR's head commit have the **same tree hash**? Equal trees mean the PR was up
   to date with `main` when it merged, so its CI ran on exactly the code being
   deployed. The PR head then needs a successful `pull_request` run of `ci.yml`
   whose **Test** job concluded `success` — a draft's run succeeds with Test
   skipped, so overall success alone is not enough.

A match skips Test and the job summary names the run it trusted; anything else
— no run, a PR that merged while behind `main` (different trees), a draft-only
CI run, or any failed lookup — runs the full suite. Type-check, lint and build
run on every deploy either way. `ci.yml` never runs on `main` itself, and the
`main` ruleset does not require branches to be up to date, so a PR's green CI
proves nothing about its merge commit unless the trees match. The PR's Test job
runs `--affected` against its base rather than the whole suite: rule 2 trusts
that packages the PR did not touch passed on the `main` it was based on, which
is the same trust the PR's own required `CI` check already places in them.
Dispatching Full gate on `main` remains the way to take the ~11-minute Test
step off a deploy whose commit fails rule 2. Deploy Production is unchanged —
it already runs the Full gate itself.

**A cancelled dev deploy is not a lost deploy.** Deploy Development's
`changes`, `verify` and `deploy-*` jobs each keep `cancel-in-progress: true`,
so a newer merge still supersedes an in-flight build — "latest merge wins".
That is only lossless because the `changes` job anchors `turbo-ignore` to the
head commit of the **last successful run of the workflow on `main`**, not to
`HEAD^1`. With a one-merge-wide `HEAD^1` window, a merge whose run was
cancelled fell outside every window that followed and was silently never
deployed — the pipeline went green having shipped nothing, and whether the
change eventually landed depended on chance (a later merge happening to touch
the same turbo graph). Anchoring to the last success stores no state of its
own — GitHub's run history is the state — and self-heals: a cancelled or
failed run never becomes the anchor, so the next merge re-evaluates every
commit back to the one the workflow last got all the way through. Note the
anchor is a **diff boundary, not a claim that something shipped**: a docs-only
merge, and a run whose deploy step is a guarded no-op because its Vercel token
isn't configured yet, both conclude `success` and both advance it. That stays
correct — the anchor's only job is to bound the window, so once a token is
configured the next real run inherits the whole accumulated window rather than
one merge of it. The
`changes` job therefore needs `actions: read` and a full-history checkout, and
logs a `::notice::` naming the anchor whenever the window is wider than one
merge (i.e. whenever it is covering for an earlier cancelled run). Queueing
the deploy jobs instead (`cancel-in-progress: false`, as `migrate` and
`migrate-db` do for their own reason — never interrupt a migration
mid-transaction) would **not** have fixed this: GitHub cancels an older
_pending_ run when a newer one queues, so a middle merge can still be dropped
even though every deploy that does start runs to completion. The trade-off
taken is a wider detection window — after a cancellation the next run may
rebuild an app whose own diff didn't require it — in exchange for never
losing a deploy. Deploy Production is unaffected: it never cancels
(workflow-level `cancel-in-progress: false`) and a tag deploys both apps
unconditionally, so it has no detection window to widen. The one case that
still needs a human is a run cancelled with no merge behind it (a manual
cancel on the newest commit): nothing is queued to heal it, so re-run the
workflow or dispatch it manually. This mirrors the comparison-commit
reasoning the Storybook `ignoreCommand` script already uses below.

**`apps/web`'s Storybook coverage is a hosted Vercel deployment, not a CI
workflow** — mirroring `packages/ui`'s existing `ui-library` project
(neither appears in the table above; a hosted Vercel deployment isn't a
GitHub Actions workflow). A second Vercel project, rooted at the repo root
(`vercel.json`, scoped via turbo to `storybook:build --filter=web`), builds
and previews `apps/web`'s own stories — see
[`docs/DEPLOY.md`](../DEPLOY.md)'s Storybook section for the setup.

Both Storybook projects share one `ignoreCommand` script,
`scripts/vercel-ignore-affected.sh`, in **two modes**.

`ui-library` uses **affected mode**
(`vercel-ignore-affected.sh <package> <watched-paths…>`): a push builds it
only when turbo sees `@blog/ui` as **affected**, _or_ when one of its watched
deploy-config paths changed — its own `vercel.json` and the shared ignore
script itself. Watching the config files means a deploy-config change (which
turbo can't see as "affecting" the package) still gets validated by a real
build instead of being silently skipped; watching the script means a change
to the skip logic self-verifies.

`web-ui-library` uses **allowlist mode**
(`vercel-ignore-affected.sh --paths <trigger-paths…>`), which drops turbo and
builds only when one of the named paths changed: the two deploy-config paths
above, plus `apps/web/.storybook`, `apps/web/**/*.stories.tsx`, `packages/ui`
and `configs/tailwind`. Affected mode was a poor fit here because the project
is scoped to the `web` package, which nearly every commit touches — it
rebuilt on ~41% of all pushes (252 of 609 over twelve days) while the stories
themselves had not moved, and Storybook builds were the single largest
consumer of the account's Vercel build-CPU allowance. Naming the real inputs
confines rebuilds to commits that can actually change the output. The trade
is a deployed Storybook that lags a plain component edit until a story,
`@blog/ui`, or the Tailwind preset moves — acceptable for a browsable
reference that is run locally (`pnpm storybook`) during development. Note
that a dependency bump alone (`pnpm-lock.yaml`) is deliberately **not** a
trigger; bump Storybook or Vite and the deployed build stays stale until one
of the listed paths moves.

Everything outside a project's triggers skips, so an unrelated PR builds
neither Storybook.

## The rendered contrast job

`CONTRAST_PAIRS` proves token pairs in isolation; the **Contrast** workflow
(`contrast.yml`) measures what actually renders. It runs
`apps/web/contrast/contrast.spec.ts`, under its own Playwright config so
`test:e2e`'s smoke run never picks it up, against the static web Storybook.

- **On demand only.** It starts from `workflow_dispatch` on the branch or
  tag picked at dispatch, which the platform Releases page sets to the
  release tag (the Actions tab works too). It checks out that ref and never
  one named by an input, so its caches stay scoped to it. No pull request
  runs it, `ci.yml` has no contrast job, and it is not a required check: on
  a private repository a per-PR run would cost more billed minutes than the
  rest of CI together.
- **Shape.** One job builds Storybook and shares it through a run-scoped
  cache key; four `Contrast shard` jobs restore it and each run a quarter of
  the suite.
- **Report.** Each shard uploads Playwright's JSON report, and a
  `Report to the platform` job, in the `development` GitHub Environment,
  POSTs a `TContrastResultBody` to `PLATFORM_APP_BASE_URL` +
  `/api/internal/contrast-result` with `CONTRAST_RESULT_SECRET` as a Bearer
  token: the dispatched commit's SHA, `PASS` only when every shard passed,
  the count of failed cases, the run URL, and the tag when dispatched on one.
  It runs whenever the run was not cancelled, so a failing suite or a failed
  Storybook build is posted as a `FAIL`. A post that is refused, or a missing
  variable or secret, fails the job.
- **Matrix.** Every story under `apps/web/src/modules/`, in each brand
  variant (PRIMARY, SECONDARY, BRAND_PRIMARY), at 1280px and 390px; within
  each, the Console and Editorial presets at their default hues and hues 130
  and 190, in light and dark. The brand variant goes through Storybook's
  `updateStoryArgs` channel event, because a story whose `argTypes` narrow
  `brandVariant` drops it as a URL arg.
- **Theme.** The web Storybook's `preset`, `accentHue` and `colorMode`
  globals, which are toolbar controls too, build the `:root` / `.dark` block
  with `buildThemeStyleBlock` from `PRESET_REGISTRY` and apply the preset's
  fonts with `resolveFontVariableClassName`
  (`apps/web/.storybook/with-site-theme.ts`). The block is kept the last
  `<style>` in `<head>`. The suite only sets the globals, so a ramp change in
  `@blog/config` reaches its results with no edit to the suite.
- **Measures.** Every visible text node at rest and with `:hover` forced
  (4.5:1, or 3:1 for large text), each focusable element's ring with
  `:focus-visible` forced, and each form control's boundary (both 3:1).
  Ratios come from what Chromium paints: the text colour is resolved on a
  canvas, and the backdrop is sampled from a screenshot with all text made
  transparent, so text over a photo or scrim is measured against the pixels
  under it. Sanity CDN images are answered with a checked-in bright fixture
  photo.
- **Baseline.** `apps/web/contrast/baseline.json` holds the failures `main`
  carried when the job landed: per story, variant and width, one line per
  element and kind, listing the theme and mode pairs where it fails. A
  failure not on it fails the run and names all of those; an entry that now
  passes fails it too, so the list can only shrink. A fix deletes its
  entries. A deliberate reset reruns the suite with
  `CONTRAST_UPDATE_BASELINE=1`, which rewrites the cases it ran; the file is
  Prettier-ignored because the suite writes it in that one-line-per-element
  shape.

## Local mirror of the required checks: `pnpm verify`

Root `pnpm verify` is one `&&` chain over every required or gating CI check
that has a local equivalent, in this order: `type-check`, `lint`, `test`,
`knip`, `check:client-graph`, `check:revalidate-tags-sync`,
`check:turbo-env-sync`, `check:migration-index`, `gen:ui-index:check`,
`gen:const-index:check`, `check:touched-lint`, `check:duplicate-literals`. The
chain stops at the first failure, so a red step is reported once rather than
buried under later output. It is the sequence `develop-feature` §5 hands to
`verify-runner`, the `## Verify` line of every issue body, and — minus
`test`, to keep a push fast — the `.husky/pre-push` hook (the non-test tail
measured 13s on one machine against a warm Turbo cache, well under the
threshold at which it would have stayed out).

| CI check                            | Local mirror                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Format** (via CI)                 | lint-staged's `prettier --write` on every commit; `pnpm exec prettier --check <files>` checks by hand.                                                                                                                                                                                                                                                                                                                                                                                       |
| **Type-check** (via CI)             | `pnpm type-check` — in `pnpm verify`.                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Lint** (via CI)                   | `pnpm lint` — in `pnpm verify`.                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Test** (via CI)                   | `pnpm test` — in `pnpm verify`; the only step `.husky/pre-push` skips.                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Knip** (via CI)                   | `pnpm knip` — in `pnpm verify`. CI adds `--treat-config-hints-as-errors`, so a stale ignore rule in `knip.json` is red there and only a hint locally.                                                                                                                                                                                                                                                                                                                                        |
| **Typegen** (via CI)                | `pnpm typegen`, then `git status --porcelain -- packages/config/src/sanity/generated/` must print nothing. Not in `pnpm verify`: typegen mutates generated files, so it runs inline in the orchestrator's session, never under `verify-runner`'s read-only guard (`develop-feature` §5). Re-run until the diff is minimal; typegen is non-deterministic.                                                                                                                                     |
| **Client graph** (gating)           | `pnpm check:client-graph` — in `pnpm verify`.                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Revalidate tags sync** (gating)   | `pnpm check:revalidate-tags-sync` — in `pnpm verify`.                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Turbo env sync** (gating)         | `pnpm check:turbo-env-sync` — in `pnpm verify`.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Migration index** (gating)        | `pnpm check:migration-index` — in `pnpm verify`. Compares against the local `origin/main` ref and never fetches, so it is only as current as the `git fetch origin` that opens `develop-feature` §5.                                                                                                                                                                                                                                                                                         |
| **UI index** (gating)               | `pnpm gen:ui-index:check` — in `pnpm verify`. CI also runs the generator's own fixture tests in Verify's Script helper tests step; those only change when `scripts/gen-ui-index.mjs` does.                                                                                                                                                                                                                                                                                                   |
| **Const index** (gating)            | `pnpm gen:const-index:check` — in `pnpm verify`. Regenerate with `pnpm gen:const-index` after adding or changing a key/value const.                                                                                                                                                                                                                                                                                                                                                          |
| Touched-file lint (local only)      | `pnpm check:touched-lint` — in `pnpm verify`; no CI step. Lints the `.ts`/`.tsx` files changed since the merge-base with `origin/main` with `BLOG_LINT_TOUCHED=1`, which adds `prefer-shared-constant` and `no-duplicate-string`.                                                                                                                                                                                                                                                            |
| Duplicate literals (local only)     | `pnpm check:duplicate-literals` — in `pnpm verify`; no CI step. Fails when a string literal the diff adds already appears in the same file, workspace or a workspace it depends on; a match in another app is printed as a note. A Sanity `_type` value, a literal type and the arguments of groqd's typed builders (`field`, `filterBy`, `filterByType`, `order`) are exempt, since the generated types check them; so are `isr(...)` tag names, which `check:revalidate-tags-sync` checks. |
| **Build** (via CI)                  | No routine mirror — `pnpm build` is CI-only by `CLAUDE.md`'s rule; run it locally only to reproduce an actual CI build failure (`open-pull-request` Gate 5a).                                                                                                                                                                                                                                                                                                                                |
| **Workflow security** (required)    | Zizmor and actionlint have no local script. When the diff touches `.claude/hooks/**` or `scripts/*.sh`, run the shellcheck + guard-test block in `develop-feature` §5 by hand.                                                                                                                                                                                                                                                                                                               |
| **Migrations** (via CI)             | None — needs the dataset. `pnpm migrate:dry` in `packages/studio` is the nearest rehearsal, and it also targets a live dataset.                                                                                                                                                                                                                                                                                                                                                              |
| **Dependency scan** (advisory)      | None — queries the OSV database over the network; run osv-scanner on `pnpm-lock.yaml` by hand to reproduce.                                                                                                                                                                                                                                                                                                                                                                                  |
| **Required env** (matrix, advisory) | `pnpm check:required-env` runs the classification half locally with no credentials; the per-environment presence half reads the repository secrets and has no local mirror. Not in `pnpm verify` — not a required check. See "Required env vars" below.                                                                                                                                                                                                                                      |
| **Contrast** (on demand)            | `pnpm --filter web storybook:build && pnpm --filter web test:contrast` — not in `pnpm verify`: the full matrix takes about half an hour on four cores. A `-g '<story id>'` filter reruns one story.                                                                                                                                                                                                                                                                                          |

The checks with no local mirror are why a local session still owns the CI
tail after any PR opens: `ci-watcher` reports them, and a red one is
diagnosed from the run log rather than reproduced (`open-pull-request` Gate
5a).

## Dependabot groups

`.github/dependabot.yml` bumps npm and GitHub Actions weekly, each capped at
five open pull requests. npm minor and patch bumps arrive as one
`minor-and-patch` pull request per run, except that `eslint`, `storybook` and
`vitest` keep their own groups, which carry majors too. Actions minor and
patch bumps arrive as one `github-actions` pull request. Every other major
bump, in either ecosystem, arrives on its own.

A dependency joins the first group whose patterns match, so the catch-all
stays last. One catch-all also means one bad bump holds up the rest of the
group: when its pull request goes red, find the offender, add a temporary
`ignore` for it, and let the next run regroup the others.

## The Vercel CLI pin tracks the pinned Node version

Both deploy workflows pin the CLI by exact version (`VERCEL_CLI_VERSION`, run
via `npx --yes "vercel@${VERCEL_CLI_VERSION}"`), and that pin is **coupled to
`NODE_VERSION`**: `vercel build` resolves `engines.node` against the supported
list bundled in that CLI's own `@vercel/build-utils`, so a CLI released before
a Node major exists rejects it outright —

```
Error: Found invalid Node.js Version: "24.x".
Please set "engines": { "node": "22.x" } in your `package.json` file to use Node.js 22.
```

The message names the newest major that CLI knows, not a version this repo
should adopt; the fix is a newer CLI, never a downgraded `engines`. Node 24
support arrived in `@vercel/build-utils` 13.0.0, first shipped by CLI
**49.0.0** — one major past the 48.0.0 pin that was in place when the repo
moved to Node 24, which is why the first dev deploy after that bump failed in
both the `deploy-web` and `deploy-admin` jobs while every other job stayed
green.

So a `NODE_VERSION` bump is not complete until a CLI that supports the new
major is pinned in **both** `deploy-development.yml` and
`deploy-production.yml`. The failure surfaces only at deploy time — nothing in
`type-check`/`lint`/`test`/`build` exercises the Vercel builder — and while
deploys are manual (see below) it can sit latent for as long as nobody
dispatches one.

## Deploy builds skip env validation

Both deploy workflows build on the GitHub runner
(`vercel pull → build → deploy --prebuilt`), and Vercel decrypts a
**Sensitive** var only inside its own builds and runtime: `vercel pull` writes
it as the literal `[SENSITIVE]`. A var that only has to be non-empty passes
that, but a format check — `PERSONAL_DATA_ENCRYPTION_KEY`'s keyring,
`PERSONAL_DATA_INDEX_KEY`'s 32 bytes — rejects it with
`Invalid environment variables` however valid the stored value is. So
`vercel build` runs with `SKIP_ENV_VALIDATION=true`, set on that one command
and never on `pull` or `deploy`. Validation still happens where the real
values exist: each app's `instrumentation.ts` imports its env module when the
deployed server starts, so a malformed value fails there with the schema's own
message. `SKIP_ENV_VALIDATION` must never be set on a Vercel project, or that
startup check is gone too.

## Required env vars

Every env var in this repo's `env.ts` modules is either required in the zod
schema or `.optional()`, and `.optional()` has to carry two different meanings:
a feature that is legitimately off, and a feature that is silently dead because
nobody provisioned its secret. `createEnv` validates eagerly at import time and
one env module is imported by every entry point, so marking a route-scoped
secret required in the schema would turn one webhook's missing secret into a
whole-app outage — optional-at-boot with a loud guard at the point of use is
correct, and it is what leaves "required in production" stated nowhere a
machine can check.

The **Required env** job closes that gap. Every `.optional()` var carries one
marker comment directly above its declaration:

```ts
// @env-required: development, production
SITE_CONFIG_REVALIDATE_SECRET: z.string().min(1).optional(),

// @env-optional
WEB_ANALYTICS_ENABLED: z.enum(['true', 'false']).optional(),
```

`scripts/check-required-env.mjs` parses those markers out of the `env.ts`
modules as a TypeScript AST, exactly as `check-turbo-env-sync.mjs` parses the
same files. It does two things:

1. **Classification coverage** — an `.optional()` var with no marker fails the
   run. This half is source-only, needs no credentials, runs anywhere
   (`pnpm check:required-env` locally), and is always blocking. It is what stops
   a newly added optional var from merging unclassified, and it is why the
   classification lives beside the declaration rather than in a separate
   manifest that would drift.
2. **Presence verification** — for each deployment environment, the vars marked
   required for it must actually exist there.

**No token is involved.** The job declares `environment: <name>`, so the
`secrets` and `vars` contexts resolve to that environment's own entries merged
over the repo-level ones. Listing environment secrets through the API instead
would need a repo-admin token, which the default `GITHUB_TOKEN` never is.

**No secret value reaches the runner.** The step passes one boolean per
required var — `REQUIRED_ENV_PRESENT_<NAME>: ${{ secrets.<NAME> != '' }}` — so
the comparison happens in GitHub's expression engine and only `true`/`false`
is ever set as an environment variable. Passing `toJSON(secrets)` would save
maintaining that list and would still let the script read names only, but it
injects every secret into the runner's environment; zizmor flags it as
`overprovisioned-secrets`, correctly.

The cost is a list of var names in the workflow that could drift from the
markers. It cannot drift silently: a var marked required with no matching
`REQUIRED_ENV_PRESENT_` input fails the run and prints the exact line to add,
and `pnpm check:required-env:test` asserts the same thing against `ci.yml`, so
the drift surfaces locally too.

Two consequences of the `environment:` approach worth knowing: the `secrets`
context merges repo-level secrets in, so a repo-level secret counts as present
for every environment (which is what a workflow actually resolves at runtime),
and a job carrying `environment:` shows up in that environment's deployment
history.

`development` is blocking; `production` warns and exits 0 while its known gaps
are open, so the check does not land red. That policy is
`BLOCKING_ENVIRONMENTS` in the script, not workflow YAML — move `production`
into it in whichever PR closes those gaps.

**Scope limit.** A GitHub Environment holds the vars CI workflows consume plus
the ones mirrored for deploy. A var read only by the running app —
`VERCEL_API_TOKEN`, `BLOB_READ_WRITE_TOKEN`, `ANTHROPIC_API_KEY` — is
provisioned in the Vercel project and never appears in a GitHub Environment at
all, so only vars provisioned in a GitHub Environment may be marked required
today. Extending the check to the Vercel side is tracked separately; see
[`environment-variables.md`](environment-variables.md).

## Deployments are temporarily manual (2026-09-04)

**Nothing deploys automatically right now.** Every automatic deployment
trigger is switched off to stay inside the Vercel metered-usage allowance
during a low-development stretch. Restoring them is tracked in #2648:

| Surface                       | How it is disabled                                                   | How to deploy now                                               |
| ----------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------- |
| Dev web app + dev admin panel | `deploy-development.yml`'s `push: branches: [main]` is commented out | `gh workflow run deploy-development.yml`, or the Actions tab    |
| `web-ui-library` Storybook    | `git.deploymentEnabled: false` in the root `vercel.json`             | Vercel dashboard → the project → **Redeploy**, or a deploy hook |
| `ui-library` Storybook        | `git.deploymentEnabled: false` in `packages/ui/vercel.json`          | same                                                            |

`deploymentEnabled: false` blocks only **Git-triggered** builds — dashboard
redeploys and deploy hooks still work, which is what keeps manual deploys
available. It is the same mechanism `apps/web` and `apps/platform` have always
used (#445); the two Storybook projects were simply the ones still on Vercel's
native Git integration.

**Why deployment count, not build time, was the problem.** Every deployment
pays roughly five seconds of build container just to clone the repo and run
`ignoreCommand` — even when that command decides to skip. At ~44 merges a day
across four Git-connected projects, the skips alone outweighed the real
builds, which is why narrowing `web-ui-library`'s triggers (above) cut its
build rate from 38% of deployments to 8% without reducing spend. Only removing
the deployments themselves moves the number.

**Two consequences to expect while this is in force.** The dev environment
drifts from `main`, so a manual dispatch is the first thing to run when
picking work back up. And Sanity content migrations plus `@blog/db` schema
migrations ride in `deploy-development.yml`, so a merged schema change leaves
the dev dataset and dev Neon branch unmigrated until that dispatch — the one
effect here that is silent rather than visible.

**When restoring automatic deploys, uncomment the trigger — do not add an
`if:` guard instead.** The `changes` job anchors to the `head_sha` of the last
_successful_ run of the workflow, so a run that succeeds with its deploy jobs
skipped advances the anchor past commits that were never deployed, and the
next real run silently skips them. A workflow that never runs leaves the
anchor parked, which is exactly what lets a later manual run cover every
commit since.

**Which commit the diff is taken against** decides all of the above, and it
depends on the situation:

- `VERCEL_GIT_PREVIOUS_SHA` when Vercel supplies one — the last **successful**
  deployment for that project and branch.
- Otherwise the merge-base with `main`, fetched by explicit URL (Vercel's build
  clone has no `origin` remote).
- Otherwise `HEAD^1`. This last step is what makes a **`main` build** work: on
  `main`, `FETCH_HEAD` is `main`, so the merge-base resolves to `HEAD` itself,
  and a commit diffed against itself shows nothing affected. Before this rule
  existed, a project that had never deployed successfully skipped every single
  `main` build — which never produced a deployment, so `VERCEL_GIT_PREVIOUS_SHA`
  stayed empty and the next merge repeated it. `web-ui-library` sat in exactly that
  deadlock, showing "No Production Deployment", until it was broken.

In **affected mode**, a change touching **only**
`packages/config/src/types/**` or `packages/config/src/sanity/generated/**`
skips regardless of affectedness. Turbo marks every dependent affected by any
`packages/config` change, but both `storybook:build` scripts are a bare
`storybook build`, which transpiles without type-checking — so type-only files
can neither reach the output nor break the build. A type-only file alongside
any other change still builds. Allowlist mode needs no such carve-out:
`packages/config` is not a trigger path, so it skips by construction.

Affected mode also inherits `turbo.json`'s `globalDependencies`: a change to
`configs/**`, the setup action, `.nvmrc`, the lockfile or `turbo.json` marks
`@blog/ui` affected and builds `ui-library`, a Dependabot lockfile bump
included.

`scripts/vercel-ignore-affected.test.sh` pins all of this (see the Hooks row
above); the script has no failing signal of its own, so a regression here is
invisible until someone notices a project has stopped deploying.

One-time environment setup (datasets, tokens, Vercel projects, secrets,
webhooks, CORS) is human-gated console work — see [`docs/DEPLOY.md`](../DEPLOY.md)
and `SPEC.md` §13. Manual `sanity deploy` / Vercel deploys are never run by
hand (agent permissions deny them; the pipeline owns deploys).
