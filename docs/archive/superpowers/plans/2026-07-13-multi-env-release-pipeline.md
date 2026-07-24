# Multi-environment Release Pipeline Implementation Plan

> **Archived — implemented.** See SPEC.md §13. Deployment topology for current behavior.

> **Status: implemented & archived (2026-07).** This is a point-in-time planning
> snapshot; the embedded workflow YAML below is an early draft and has since
> diverged from what shipped (the dev pipeline gained `changes`/`verify`/`migrate`
> jobs, per-job concurrency, and CLI-based web deploys). The **authoritative**
> sources are the live workflow files (`.github/workflows/deploy-development.yml`,
> `deploy-production.yml`), `SPEC.md` §13, and `docs/DEPLOY.md`. Do not treat the
> code blocks here as current — read them as historical intent only.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automate environment-specific deploys — `main` → development, `v*` tag → production — for both the Sanity Studio and the Next.js web app.

**Architecture:** Two Vercel projects (`blog-dev`, `blog-prod`) give full isolation. Dev web deploys via Vercel's native Git integration on `main`; the dev Studio deploys from a GitHub Action on `main`. Production (Studio + web) deploys from a GitHub Action on `v*` tags, gated by a `verify` job that re-runs the full quality suite on the tagged commit. The Sanity CLI becomes env-driven on the studio hostname so one config deploys two hostnames.

**Tech Stack:** GitHub Actions, Sanity CLI v6 (`sanity deploy`), Vercel CLI, pnpm 9.15.0 / Node 22, existing `.github/actions/setup` composite, zizmor (workflow audit).

**Spec:** `docs/archive/superpowers/specs/2026-07-13-multi-env-release-pipeline-design.md`

## Global Constraints

- Node `22`, pnpm `9.15.0` (copy from `ci.yml` `env`).
- **All third-party actions pinned by full commit SHA** with a `# vX` comment (zizmor gate). Reuse `actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0 # v7`.
- Every job: `permissions: contents: read` (top-level), `persist-credentials: false` on checkout.
- Sanity CLI authenticates non-interactively from `SANITY_AUTH_TOKEN`.
- `SANITY_STUDIO_PROJECT_ID` comes from repo **Variable** `vars.SANITY_STUDIO_PROJECT_ID` (public id, not a secret).
- Studio hostnames: dev `valovinnikov-blog-dev`, prod `valovinnikov-blog`.
- Datasets: dev `development`, prod `production`.
- Deploy steps are **guarded on their secret being present** (`if: env.X != ''`) so the workflows are safe to merge before the human setup exists — they no-op green until secrets are configured (same pattern as `ci.yml`'s migrations dry-run).
- No `any`; TypeScript strict (applies to the `sanity.cli.ts` change).

---

## File Structure

- `apps/cms/sanity.cli.ts` (modify) — add env-driven `studioHost`. _(cms agent owns this file)_
- `.github/workflows/deploy-development.yml` (create) — dev Studio deploy on `main`.
- `.github/workflows/deploy-production.yml` (create) — verify + prod Studio + prod web on `v*`.
- `SPEC.md` (modify) — deploy topology + environment matrix.
- `CLAUDE.md` (modify) — note the pipeline in the deploy section.
- `docs/DEPLOY.md` (create) — human one-time-setup + release runbook (from spec §11–§12).

---

## Task 1: Env-driven studio hostname in the Sanity CLI

**Files:**

- Modify: `apps/cms/sanity.cli.ts`

**Interfaces:**

- Produces: the deployed studio hostname is read from `process.env.SANITY_STUDIO_HOSTNAME`. When unset (local `dev`/`migrate`/`typegen`), `studioHost` is `undefined` and CLI commands other than `deploy` are unaffected. The two deploy workflows (Tasks 2–3) set this var.

- [ ] **Step 1: Add `studioHost` to the CLI config**

Modify `apps/cms/sanity.cli.ts` — add a `studioHost` key inside the existing `defineCliConfig({ ... })`, sourced from the env var. `studioHost` accepts `string | undefined`; leaving it undefined when the var is absent keeps `dev`/`migrations`/`typegen` working exactly as today (only `deploy` consumes it).

```ts
export default defineCliConfig({
  // Deploy target hostname (<studioHost>.sanity.studio). Env-driven so one
  // config deploys both the dev and prod Studios from CI; unset locally where
  // only `dev`/`migrations`/`typegen` run (which don't use it).
  studioHost: process.env.SANITY_STUDIO_HOSTNAME,
  api: {
    projectId: requireEnv(
      'SANITY_STUDIO_PROJECT_ID',
      process.env.SANITY_STUDIO_PROJECT_ID,
    ),
    dataset: requireEnv(
      'SANITY_STUDIO_DATASET',
      process.env.SANITY_STUDIO_DATASET,
    ),
  },
  typegen: {
    path: './src/**/*.{ts,tsx}',
    schema: '../../packages/config/src/sanity/generated/schema.json',
    generates: '../../packages/config/src/sanity/generated/types.ts',
    overloadClientMethods: true,
  },
});
```

- [ ] **Step 2: Type-check passes**

Run: `pnpm --filter cms type-check`
Expected: PASS (no type error — `studioHost` is a valid optional field on `CliConfig`).

- [ ] **Step 3: Config still loads with the var unset**

Run: `cd apps/cms && SANITY_STUDIO_PROJECT_ID=x SANITY_STUDIO_DATASET=development pnpm exec sanity debug --secrets >/dev/null 2>&1; echo "exit=$?"`
Expected: exit `0` (config parses; `studioHost` undefined is fine). If `sanity debug` needs auth, substitute `pnpm exec sanity help deploy >/dev/null; echo "exit=$?"` which loads the CLI config without network.

- [ ] **Step 4: Commit**

```bash
git add apps/cms/sanity.cli.ts
git commit -m "feat(cms): env-driven studio hostname for CI deploys"
```

---

## Task 2: Development deploy workflow (dev Studio on `main`)

**Files:**

- Create: `.github/workflows/deploy-development.yml`

**Interfaces:**

- Consumes: `SANITY_STUDIO_HOSTNAME` support from Task 1; repo Variable `vars.SANITY_STUDIO_PROJECT_ID`; repo secret `SANITY_DEPLOY_TOKEN` (write/deploy-scoped Sanity token).
- Produces: on every push to `main` touching CMS/config, deploys `valovinnikov-blog-dev.sanity.studio` against the `development` dataset. Dev **web** is handled by Vercel's native Git integration on `blog-dev` — not this workflow.

- [ ] **Step 1: Create the workflow file**

Create `.github/workflows/deploy-development.yml`:

```yaml
name: Deploy Development

# Dev web deploys via Vercel's native Git integration on `main` (project
# `blog-dev`). This workflow only deploys the dev Studio. Path-filtered because
# it is NOT a required status check (safe to skip), unlike ci.yml.
on:
  push:
    branches: [main]
    paths:
      - 'apps/cms/**'
      - 'packages/config/**'
      - '.github/workflows/deploy-development.yml'
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: deploy-dev-studio
  cancel-in-progress: true

env:
  PNPM_VERSION: 9.15.0
  NODE_VERSION: '22'

jobs:
  deploy-studio:
    name: Deploy dev Studio
    runs-on: ubuntu-latest
    timeout-minutes: 10
    environment: development
    env:
      SANITY_STUDIO_PROJECT_ID: ${{ vars.SANITY_STUDIO_PROJECT_ID }}
      SANITY_STUDIO_DATASET: development
      SANITY_STUDIO_HOSTNAME: valovinnikov-blog-dev
      SANITY_AUTH_TOKEN: ${{ secrets.SANITY_DEPLOY_TOKEN }}
    steps:
      - uses: actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0 # v7
        with:
          persist-credentials: false

      - uses: ./.github/actions/setup
        with:
          pnpm-version: ${{ env.PNPM_VERSION }}
          node-version: ${{ env.NODE_VERSION }}

      # No-op (green) until SANITY_DEPLOY_TOKEN is configured, so this is safe
      # to merge before the one-time human setup exists.
      - name: Deploy Studio
        if: ${{ env.SANITY_AUTH_TOKEN != '' }}
        working-directory: apps/cms
        run: pnpm exec sanity deploy
```

- [ ] **Step 2: Lint the workflow with zizmor (the repo's gate)**

Run: `uvx "zizmor@1.26.1" --format=plain .github/workflows/deploy-development.yml`
Expected: no findings (exit 0). If `uvx` is unavailable locally, run `pipx run zizmor` or rely on the Zizmor PR check.

- [ ] **Step 3: Validate YAML parses**

Run: `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/deploy-development.yml')); print('ok')"`
Expected: `ok`

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy-development.yml
git commit -m "ci: deploy dev Studio on merge to main"
```

---

## Task 3: Production deploy workflow (verify → prod Studio + prod web on `v*`)

**Files:**

- Create: `.github/workflows/deploy-production.yml`

**Interfaces:**

- Consumes: Task 1's `SANITY_STUDIO_HOSTNAME`; secrets `SANITY_DEPLOY_TOKEN`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (the last three for `blog-prod`).
- Produces: on a `v*` tag, after `verify` passes, deploys `valovinnikov-blog.sanity.studio` (production dataset) and the `blog-prod` web app.

- [ ] **Step 1: Create the workflow file**

Create `.github/workflows/deploy-production.yml`:

```yaml
name: Deploy Production

on:
  push:
    tags: ['v*']

permissions:
  contents: read

# Never cancel an in-flight production deploy.
concurrency:
  group: deploy-prod
  cancel-in-progress: false

env:
  PNPM_VERSION: 9.15.0
  NODE_VERSION: '22'
  VERCEL_CLI_VERSION: 48.0.0

jobs:
  # A tag can point at ANY commit with no PR gate, so re-run the full suite on
  # the exact tagged commit before anything is promoted to production.
  verify:
    name: Verify
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0 # v7
        with:
          persist-credentials: false
      - uses: ./.github/actions/setup
        with:
          pnpm-version: ${{ env.PNPM_VERSION }}
          node-version: ${{ env.NODE_VERSION }}
      - name: Type-check
        run: pnpm type-check
      - name: Lint
        run: pnpm lint
      - name: Test
        run: pnpm test
      - name: Build
        run: pnpm build
        env:
          SKIP_ENV_VALIDATION: 'true'

  deploy-studio:
    name: Deploy prod Studio
    needs: verify
    runs-on: ubuntu-latest
    timeout-minutes: 10
    environment: production
    env:
      SANITY_STUDIO_PROJECT_ID: ${{ vars.SANITY_STUDIO_PROJECT_ID }}
      SANITY_STUDIO_DATASET: production
      SANITY_STUDIO_HOSTNAME: valovinnikov-blog
      SANITY_AUTH_TOKEN: ${{ secrets.SANITY_DEPLOY_TOKEN }}
    steps:
      - uses: actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0 # v7
        with:
          persist-credentials: false
      - uses: ./.github/actions/setup
        with:
          pnpm-version: ${{ env.PNPM_VERSION }}
          node-version: ${{ env.NODE_VERSION }}
      - name: Deploy Studio
        if: ${{ env.SANITY_AUTH_TOKEN != '' }}
        working-directory: apps/cms
        run: pnpm exec sanity deploy

  deploy-web:
    name: Deploy prod web
    needs: verify
    runs-on: ubuntu-latest
    timeout-minutes: 15
    environment: production
    env:
      VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
      VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
      VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
    steps:
      - uses: actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0 # v7
        with:
          persist-credentials: false
      # Vercel CLI runs its own `next build` with the project's Production env
      # vars pulled from Vercel (root directory apps/web is stored on the
      # project, so build resolves the monorepo workspaces correctly).
      - name: Deploy to Vercel (production)
        if: ${{ env.VERCEL_TOKEN != '' }}
        run: |
          set -euo pipefail
          npx --yes "vercel@${VERCEL_CLI_VERSION}" pull --yes --environment=production --token="$VERCEL_TOKEN"
          npx --yes "vercel@${VERCEL_CLI_VERSION}" build --prod --token="$VERCEL_TOKEN"
          npx --yes "vercel@${VERCEL_CLI_VERSION}" deploy --prebuilt --prod --token="$VERCEL_TOKEN"
```

- [ ] **Step 2: Verify Vercel CLI monorepo flags via context7**

Before trusting the CLI invocation, confirm current `vercel pull/build/deploy --prebuilt` flags and monorepo root behavior for the installed major version. Use the `use-context7` skill (resolve `vercel` / Vercel CLI docs). Adjust the `VERCEL_CLI_VERSION` pin and flags if the docs differ.
Expected: commands match documented CI usage; root-directory handling confirmed to come from `vercel pull`.

- [ ] **Step 3: Lint with zizmor**

Run: `uvx "zizmor@1.26.1" --format=plain .github/workflows/deploy-production.yml`
Expected: no findings. (Watch for template-injection warnings — no `${{ github.* }}` interpolated into `run:`; tokens are passed via `env`, not inline.)

- [ ] **Step 4: Validate YAML parses**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy-production.yml')); print('ok')"`
Expected: `ok`

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/deploy-production.yml
git commit -m "ci: deploy prod Studio + web on v* tags with verify gate"
```

---

## Task 4: Docs — SPEC, CLAUDE, and the deploy runbook

**Files:**

- Modify: `SPEC.md`
- Modify: `CLAUDE.md`
- Create: `docs/DEPLOY.md`

**Interfaces:**

- Consumes: nothing (documentation). Reflects Tasks 1–3 and the spec's §11 human setup / §12 runbook.

- [ ] **Step 1: Add deploy topology to `SPEC.md`**

Add a "Deployment & environments" section: the two-environment matrix (table from spec §2), the `main`→dev / `v*`→prod triggers, two Vercel projects, env-driven studio hostname, and the two revalidation webhooks. Cross-reference `docs/DEPLOY.md`.

- [ ] **Step 2: Note the pipeline in `CLAUDE.md`**

In the deploy/"Don't" area, add: deploys are automated by the pipeline (`main`→development, `v*` tag→production); the one-time environment setup is human-gated; `git tag vX.Y.Z && git push` is the release action. Point to `docs/DEPLOY.md`.

- [ ] **Step 3: Create `docs/DEPLOY.md`**

Write the human one-time-setup checklist (spec §11) and the ongoing release runbook (spec §12), including: create `development` dataset; mint read + deploy tokens; create `blog-dev`/`blog-prod` Vercel projects with per-project env vars; set `blog-prod` Ignored Build Step to always-skip; `vercel link` `blog-prod` and record `VERCEL_ORG_ID`/`VERCEL_PROJECT_ID`; add GitHub Actions secrets/variables (`SANITY_DEPLOY_TOKEN`, `VERCEL_*`, `vars.SANITY_STUDIO_PROJECT_ID`); create the two webhooks; CORS entries. Include the "cut a release" commands.

- [ ] **Step 4: Sanity-check docs build/links**

Run: `pnpm lint` (catches nothing in md, but confirms no accidental code changes) and manually confirm the three files reference each other consistently.
Expected: no broken internal references; matrix matches the workflows' hostnames/datasets.

- [ ] **Step 5: Commit**

```bash
git add SPEC.md CLAUDE.md docs/DEPLOY.md
git commit -m "docs: multi-environment deploy topology and release runbook"
```

---

## Out of band: one-time human setup (NOT code tasks)

These are human-gated console steps (spec §11). The workflows are written to no-op green until the secrets exist, so Tasks 1–4 can merge first. The pipeline goes live once these are done:

1. Create `development` dataset; confirm `production`.
2. Mint `SANITY_API_READ_TOKEN` (Viewer) and `SANITY_DEPLOY_TOKEN` (Deploy/write).
3. Create Vercel `blog-dev` (Git-connected, Production Branch `main`) and `blog-prod` (Ignored Build Step = always skip); set env vars per environment; `vercel link` `blog-prod`.
4. Add GitHub Actions secrets: `SANITY_DEPLOY_TOKEN`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`; Variable `SANITY_STUDIO_PROJECT_ID`.
5. Create the two Sanity webhooks (dev/prod) → `/api/revalidate`.
6. Set CORS origins.
7. First release: `git tag v0.1.0 && git push origin v0.1.0`.

---

## Self-Review

**Spec coverage:**

- §2 matrix → Tasks 2/3 (hostnames, datasets) + Task 4 (documented). ✓
- §3 versioning → Task 4 runbook. ✓
- §4a PR preview → unchanged (Vercel native); noted in Task 2 comment. ✓
- §4b dev → Task 2 (Studio) + Vercel native (web). ✓
- §4c prod + verify gate → Task 3 (`verify` job + `needs`). ✓
- §5 two Vercel projects → Task 3 (`blog-prod` CLI) + Task 4/§out-of-band. ✓
- §6 env-driven hostname → Task 1. ✓
- §7 datasets → out-of-band setup + Task 4. ✓
- §8 webhooks → Task 4 + out-of-band. ✓
- §9 secrets → Global Constraints + Task 3 env + out-of-band. ✓
- §10 repo changes → Tasks 1–4 one-to-one. ✓

**Placeholder scan:** No TBD/TODO; every workflow shown in full; the one "verify externally" step (Task 3 Step 2) is a deliberate context7 confirmation, not a code placeholder.

**Type consistency:** `SANITY_STUDIO_HOSTNAME` (Task 1) is the exact var set in Tasks 2 and 3. `SANITY_DEPLOY_TOKEN`, `VERCEL_TOKEN/ORG_ID/PROJECT_ID` names match between Task 3, Global Constraints, and out-of-band setup. Hostnames (`valovinnikov-blog-dev`, `valovinnikov-blog`) and datasets (`development`, `production`) consistent across tasks.
