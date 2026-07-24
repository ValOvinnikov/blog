# Deploy & release runbook

How this blog deploys, and the one-time setup that makes the pipeline live.

- **Local dev + every `main` merge** → **development** environment
  (`development` dataset).
- **Push a `vX.Y.Z` git tag** → **production** environment (`production`
  dataset).

On a `main` merge, the Sanity **Studio** and the Next.js **web app** each deploy
only when the merge touches their turbo graph (`turbo-ignore`; a manual
`workflow_dispatch` run deploys both). A production tag always deploys both.
Architecture rationale lives in `SPEC.md` §13 and
`docs/archive/superpowers/specs/2026-07-13-multi-env-release-pipeline-design.md`.

> **Each environment is a separate Sanity project** (one per environment) — not
> one project with two datasets. Project ids stay **env-driven and are never
> committed** (this repo hardcodes no Sanity ids — see `<DEV_PROJECT_ID>` /
> `<PRD_PROJECT_ID>` below). Because Sanity **tokens are project-scoped**, dev and
> prod each need their own read + deploy tokens, wired as **environment-scoped**
> GitHub secrets/variables (the `development` / `production` GitHub Environments),
> not repo-level. `blog-dev` and `blog-prod` likewise point
> `NEXT_PUBLIC_SANITY_PROJECT_ID` at different project ids.

---

## Environment matrix

| Concern               | Development                           | Production                         |
| --------------------- | ------------------------------------- | ---------------------------------- |
| Sanity project        | separate dev project (id via env)     | separate prod project (id via env) |
| Sanity dataset        | `development`                         | `production`                       |
| Studio hostname       | `valovinnikov-blog-dev.sanity.studio` | `valovinnikov-blog.sanity.studio`  |
| Vercel project        | `blog-dev`                            | `blog-prod`                        |
| Web URL (initial)     | `<DEV_WEB_URL>`                       | `<PRD_WEB_URL>`                    |
| Deploy trigger        | push/merge to `main`                  | push git tag `v*`                  |
| Web deploy            | Vercel CLI (GitHub Actions)           | Vercel CLI (GitHub Actions)        |
| Studio deploy         | GitHub Actions                        | GitHub Actions                     |
| CI gate before deploy | `verify` job on `main`                | `verify` job on the `v*` tag       |
| Revalidation webhook  | dev → dev site                        | prod → prod site                   |

> `<DEV_WEB_URL>` / `<PRD_WEB_URL>` are each project's `*.vercel.app` URL — either
> the auto-assigned one (e.g. `blog-web-<random>.vercel.app`) or a stable alias you
> add in Vercel → Settings → Domains. Use the same value in `NEXT_PUBLIC_SITE_URL`,
> the CORS origin, and the webhook URL. Custom domains are deferred (#275).

---

## Values scratchpad

Collect these **per environment** — dev and prod are separate Sanity projects, so
the project id and all tokens differ. The `<PLACEHOLDER>` names are used only
within this doc; the real values live in GitHub / Vercel / local `.env` and are
**never committed** (project ids included).

| What                                       | Development               | Production                |
| ------------------------------------------ | ------------------------- | ------------------------- |
| Sanity project id (public)                 | `<DEV_PROJECT_ID>`        | `<PRD_PROJECT_ID>`        |
| Sanity dataset                             | `development`             | `production`              |
| Sanity **Viewer** token                    | `<DEV_READ_TOKEN>`        | `<PRD_READ_TOKEN>`        |
| Sanity **Deploy** token                    | `<DEV_DEPLOY_TOKEN>`      | `<PRD_DEPLOY_TOKEN>`      |
| Sanity **Migrate** token (Editor)          | `<DEV_MIGRATE_TOKEN>`     | `<PRD_MIGRATE_TOKEN>`     |
| Revalidate secret (`openssl rand -hex 32`) | `<DEV_REVALIDATE_SECRET>` | `<PRD_REVALIDATE_SECRET>` |

Vercel (needed for **both** dev and prod web deploys — both go through the Vercel
CLI in CI): `<VERCEL_TOKEN>` (account token) and `<VERCEL_ORG_ID>` are shared;
`<VERCEL_PROJECT_ID>` is **per project** (`blog-dev` vs `blog-prod`, from
`vercel link`).

---

## One-time setup (human-gated console work)

The workflows are written to **no-op green until their secrets exist**, so the
code can merge first; the pipeline activates once the steps below are done.

### 1. Sanity — projects, datasets & tokens · https://manage.sanity.io

Do this in **each** project (dev and prod are separate projects; tokens are
project-scoped, so mint them **inside** the matching project):

- [ ] **Dataset:** dev project → `development`; prod project → `production`
      (visibility public is fine).
- [ ] **API → Project ID:** copy → `<DEV_PROJECT_ID>` / `<PRD_PROJECT_ID>`.
- [ ] **API → Tokens → Add API token** (per project):
  - [ ] `web-read` — permission **Viewer** → `<DEV_READ_TOKEN>` / `<PRD_READ_TOKEN>`.
  - [ ] `ci-deploy` — permission **Deploy Studio** (write) → `<DEV_DEPLOY_TOKEN>` / `<PRD_DEPLOY_TOKEN>`.
        (Distinct from the read token; `sanity deploy` needs write.)
  - [ ] `ci-migrate` — permission **Editor** → `<DEV_MIGRATE_TOKEN>` / `<PRD_MIGRATE_TOKEN>`.
        (Content migrations mutate documents; the Deploy-Studio token can't —
        a real `migrate:deploy` run gets "permission update required". Kept
        separate from `ci-deploy` for least privilege.)

### 2. Secrets to generate locally

```sh
openssl rand -hex 32   # → DEV_REVALIDATE_SECRET
openssl rand -hex 32   # → PRD_REVALIDATE_SECRET
```

### 3. Vercel — two projects · https://vercel.com

For **each** project (`blog-dev`, `blog-prod`): Add New → Project → import
`ValOvinnikov/blog`; **Root Directory `apps/web`** + tick _"Include files
outside of the root directory"_; **Node.js 22.x**.

Both projects have Vercel's Git auto-deploy **disabled** — every deploy goes
through a CI-gated GitHub Actions job (no pre-merge/preview deploys, nothing
deploys before checks pass). This is set **once, in code**, via
`apps/web/vercel.json`'s `git.deploymentEnabled: false` — since both
projects' Root Directory is `apps/web`, the committed file governs auto-deploy
for both projects identically, and can't silently drift the way a
per-project console toggle (the old "Ignored Build Step" setting) could — a
missed one-time click on `blog-prod` once meant it deployed on every branch
push, uncontrolled, until #445 replaced it with this file. Nothing to set per
project in the dashboard for this anymore; only project linking remains:

- [ ] **`blog-dev`**
  - [ ] From repo root: `npx vercel link` → select `blog-dev`. Read the ids from
        `.vercel/project.json` → `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
        (Then delete the local `.vercel/` dir — it's gitignored scratch.)
- [ ] **`blog-prod`**
  - [ ] From repo root: `npx vercel link` → select `blog-prod`. Read the ids
        from `.vercel/project.json` → `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
        (Then delete the local `.vercel/` dir — it's gitignored scratch.)

#### Vercel env vars — set on **each** project (Production + Preview scopes)

Same five keys per project; each project points at its **own** Sanity project,
so the id / dataset / URL / tokens all differ:

| Key                             | `blog-dev` value          | `blog-prod` value         |
| ------------------------------- | ------------------------- | ------------------------- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | `<DEV_PROJECT_ID>`        | `<PRD_PROJECT_ID>`        |
| `NEXT_PUBLIC_SANITY_DATASET`    | `development`             | `production`              |
| `NEXT_PUBLIC_SITE_URL`          | `https://<DEV_WEB_URL>`   | `https://<PRD_WEB_URL>`   |
| `SANITY_API_READ_TOKEN`         | `<DEV_READ_TOKEN>`        | `<PRD_READ_TOKEN>`        |
| `SANITY_REVALIDATE_SECRET`      | `<DEV_REVALIDATE_SECRET>` | `<PRD_REVALIDATE_SECRET>` |

> `SANITY_API_READ_TOKEN` is server-only (never exposed to the browser). Each
> project uses the Viewer token minted in its own Sanity project.

### 4. GitHub Actions — environment-scoped variables & secrets

The deploy jobs run in the `development` / `production` **GitHub Environments**,
so set these per environment (Settings → Environments → `<env>`) — that's how each
job resolves its own project's id + token:

**`development` environment**

- [ ] Variable `SANITY_STUDIO_PROJECT_ID` = `<DEV_PROJECT_ID>`
- [ ] Secret `SANITY_DEPLOY_TOKEN` = `<DEV_DEPLOY_TOKEN>`
- [ ] Secret `SANITY_MIGRATE_TOKEN` = `<DEV_MIGRATE_TOKEN>` (Editor — the migrate job)
- [ ] Secret `VERCEL_TOKEN` = `<VERCEL_TOKEN>`
- [ ] Variable `VERCEL_ORG_ID` = `<VERCEL_ORG_ID>`
- [ ] Variable `VERCEL_PROJECT_ID` = `<VERCEL_PROJECT_ID>` (**blog-dev**)

**`production` environment**

- [ ] Variable `SANITY_STUDIO_PROJECT_ID` = `<PRD_PROJECT_ID>`
- [ ] Secret `SANITY_DEPLOY_TOKEN` = `<PRD_DEPLOY_TOKEN>`
- [ ] Secret `SANITY_MIGRATE_TOKEN` = `<PRD_MIGRATE_TOKEN>` (Editor — the migrate job)
- [ ] Secret `VERCEL_TOKEN` = `<VERCEL_TOKEN>`
- [ ] Variable `VERCEL_ORG_ID` = `<VERCEL_ORG_ID>`
- [ ] Variable `VERCEL_PROJECT_ID` = `<VERCEL_PROJECT_ID>` (**blog-prod**)
- [ ] (Optional) require a reviewer on `production` for a manual gate before prod
      deploys run.

> Repo-level `SANITY_STUDIO_PROJECT_ID` / `SANITY_STUDIO_DATASET` remain the
> fallback for `ci.yml` (which sets no environment) — point them at whichever
> project CI's typegen/migration checks should target.

**`dataset-refresh` environment** — a dedicated GitHub Environment (separate
from `development`/`production`) for `refresh-dev-dataset.yml`
(`workflow_dispatch` only, #363): this single job needs **both** projects'
credentials at once, which a `development`- or `production`-scoped job can't
provide.

- [ ] Variable `SANITY_PROD_PROJECT_ID` = `<PRD_PROJECT_ID>` (export source)
- [ ] Secret `SANITY_PROD_EXPORT_TOKEN` = `<PRD_EXPORT_TOKEN>` (Viewer — export
      only, never a deploy/migrate token)
- [ ] Variable `SANITY_DEV_PROJECT_ID` = `<DEV_PROJECT_ID>` (import target)
- [ ] Secret `SANITY_DEV_IMPORT_TOKEN` = `<DEV_IMPORT_TOKEN>` (**Administrator**
      — deleting and recreating a dataset needs more than Editor)
- [ ] (Recommended) require a reviewer on `dataset-refresh` — an extra human
      gate before the job deletes and replaces the `development` dataset.

**Repo level (Settings → Secrets and variables → Actions) — Turborepo Remote Cache**

Optional but recommended: shares turbo task artifacts across PR CI, the deploy
verify jobs, and local dev, so unchanged tasks replay instead of rebuilding.
Run `npx turbo login && npx turbo link` once locally (or mint a token in the
Vercel dashboard → Account/Team Settings → Tokens), then:

- [ ] Secret `TURBO_TOKEN` = `<VERCEL_ACCESS_TOKEN>`
- [ ] Variable `TURBO_TEAM` = `<VERCEL_TEAM_SLUG>`

Until both exist the workflows fall back to the local `.turbo` cache — nothing
breaks.

### 5. Sanity — revalidation webhooks · API → Webhooks → Create webhook

Create **two** (the route `/api/revalidate` already exists):

| Field       | dev webhook                            | prod webhook                           |
| ----------- | -------------------------------------- | -------------------------------------- |
| Name        | `revalidate dev`                       | `revalidate prod`                      |
| URL         | `https://<DEV_WEB_URL>/api/revalidate` | `https://<PRD_WEB_URL>/api/revalidate` |
| Dataset     | `development`                          | `production`                           |
| Trigger     | Create · Update · Delete               | Create · Update · Delete               |
| HTTP method | `POST`                                 | `POST`                                 |
| API version | `v2021-03-25` (or later)               | `v2021-03-25` (or later)               |
| Projection  | `{_type, _id, "slug": slug.current}`   | `{_type, _id, "slug": slug.current}`   |
| Secret      | `<DEV_REVALIDATE_SECRET>`              | `<PRD_REVALIDATE_SECRET>`              |

### 6. Sanity — CORS origins · API → CORS origins

- [ ] `http://localhost:3333` — credentials **on** (local Studio).
- [ ] `https://valovinnikov-blog-dev.sanity.studio` — credentials **on**.
- [ ] `https://valovinnikov-blog.sanity.studio` — credentials **on**.
- [ ] `https://<DEV_WEB_URL>` — credentials **off** (token reads).
- [ ] `https://<PRD_WEB_URL>` — credentials **off**.

### 7. Local dev configuration

Local dev points at the **dev** project (`<DEV_PROJECT_ID>`):

- [ ] `apps/cms/.env` (gitignored): `SANITY_STUDIO_PROJECT_ID=<DEV_PROJECT_ID>`,
      `SANITY_STUDIO_DATASET=development`.
- [ ] `apps/web/.env.local` (gitignored): `NEXT_PUBLIC_SANITY_PROJECT_ID=<DEV_PROJECT_ID>`,
      `NEXT_PUBLIC_SANITY_DATASET=development`, and optionally
      `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.
- [ ] (Optional) seed the dev `development` dataset — author fresh content in the
      dev Studio, or export/import from another dataset. It's empty until seeded.

---

## How a deploy happens (steady state)

### Development — on merge to `main`

`.github/workflows/deploy-development.yml` (Vercel's Git auto-deploy for
`blog-dev` is disabled, so this is the **only** path — nothing deploys pre-merge
or before checks):

1. **`changes` gate** runs `turbo-ignore` per app — a deploy job only runs when
   the merge affects that app's turbo graph (`workflow_dispatch` forces both;
   a no-op merge skips everything, including `verify`).
2. **`verify` gate** re-runs `type-check` / `lint` / `test` / `build` on the
   merged commit.
3. **`migrate`** (`environment: development`) applies any un-applied migrations
   to the **development** dataset via `migrate:deploy` (a no-op when none are
   pending), so dev's data never lags its code — the #355 failure mode. It runs
   on the same condition as `verify` (so it's never skipped out from under a
   deploy that depends on it); both deploy jobs `needs: [changes, verify,
migrate]`. No artifact backup here — dev is the disposable staging line
   (see "Refreshing development from production" below for the manual
   post-migration refresh); the job is guarded on `SANITY_DEPLOY_TOKEN`,
   so it's inert until that secret exists. **No approval gate on dev** (unlike
   prod) — dev auto-migrates.
4. **`deploy-studio`** → `valovinnikov-blog-dev.sanity.studio` (development
   dataset).
5. **`deploy-web`** → `blog-dev` via the Vercel CLI
   (`vercel pull → build --prod → deploy --prebuilt --prod`).

Concurrency is scoped **per job**, not workflow-wide. `changes` / `verify` /
`deploy-*` each keep `cancel-in-progress: true`, so a newer merge still
supersedes an in-flight build/deploy — "latest merge wins" still holds. (The
supersede is slightly lazier than the old workflow-level cancel: a per-job
group cancels an older run's `deploy-web`/`deploy-studio` only once the newer
run's _same_ job is ready to start — i.e. after the newer run clears its own
`changes` → `verify` → `migrate` chain — so an old deploy can finish before
being superseded rather than being cut off the instant a new run starts.) The
`migrate` job is the exception — its group uses `cancel-in-progress: false`
(#409), so a newer merge **queues behind** a running migration instead of
interrupting a dataset mutation mid-transaction. GitHub keeps at most one
pending run per group, so a burst of merges collapses to "finish the current
migration, then run the latest".

There are **no PR preview deployments** — deploys happen only on merge to `main`.

### Production — on a `vX.Y.Z` tag

`.github/workflows/deploy-production.yml`:

1. **`verify` gate** re-runs `type-check` / `lint` / `test` / `build` on the
   tagged commit, so a red commit can never be promoted — even if you tag the
   wrong SHA.
2. **`migrate`** (`environment: production`, `needs: verify`) — exports a backup
   of the production dataset (uploaded as a 30-day artifact) **before** any
   mutation, then runs `migrate:deploy --yes` to apply only the un-applied
   content migrations (dry → run → record in the `migrationState` ledger,
   idempotent). The `production` environment's required reviewer is the human
   approval gate. Every step is guarded on `SANITY_DEPLOY_TOKEN`, so the job is a
   **no-op until that secret is configured** — safe to ship ahead of setup.
3. **`deploy-studio`** → `valovinnikov-blog.sanity.studio` (production dataset).
4. **`deploy-web`** → `blog-prod` via the Vercel CLI
   (`vercel pull → build --prod → deploy --prebuilt --prod`).

Both deploy jobs `needs: [verify, migrate]`, so **new code is never served
before pending migrations run**; a failed or reviewer-rejected `migrate` skips
both deploys, leaving the old code serving the old (un-migrated) data.

### Refreshing development from production (manual, post-migration)

The `development` dataset drifts from real content over time. `.github/workflows/refresh-dev-dataset.yml`
(`workflow_dispatch` only — never automatic, never part of a deploy) replaces
`development` with a fresh copy of `production`, cross-project (dev and prod
are separate Sanity projects, so this is an export→import, not
`sanity dataset copy`). Published documents only — drafts are excluded.
Assets are included; since the target dataset is deleted and recreated each
run, there's no cross-run asset accumulation.

**Run this only after that release's production migrations have completed**
(step 2 above) — refreshing from a not-yet-migrated `production` would copy
pre-migration shapes that no longer match the deployed schema:

1. Confirm the `production` deploy's `migrate` job finished (Actions tab).
2. Actions → **Refresh Dev Dataset** → **Run workflow** (`main`).
3. The job exports `production` (published-only), deletes and recreates
   `development`, then imports — direction is hardcoded in
   `apps/cms/scripts/refresh-dev-dataset-lib.mjs`'s safety guard, so a
   misconfigured environment fails loudly rather than silently reversing.

See `apps/cms/migrations/README.md` for the underlying script details.

---

## Cutting a release

```sh
git checkout main && git pull
git tag v0.1.0
git push origin v0.1.0     # ← triggers the production deploy
```

**Versioning (SemVer `vMAJOR.MINOR.PATCH`):** PATCH = fixes/copy; MINOR = new
features/sections; MAJOR = milestone / breaking redesign; `v1.0.0` = official
launch. Pre-1.0 (`0.y.z`): bump MINOR freely for notable changes, PATCH for
fixes. Only tag commits already green on `main`. Rollback = re-tag an earlier
commit or redeploy a prior Vercel build.

---

## Post-deploy verification

- [ ] Home page renders (hero + latest posts) with `cdn.sanity.io` images.
- [ ] Response headers include the CSP / security headers (`next.config.ts`).
- [ ] A merge to `main` runs `Deploy Development` → `verify` passes → Studio + web
      deploy (no deploy runs before `verify` is green, and PRs never deploy).
- [ ] Publishing in the Studio updates the corresponding site within seconds
      (webhook). Dev publishes hit the dev site; prod publishes hit prod.
