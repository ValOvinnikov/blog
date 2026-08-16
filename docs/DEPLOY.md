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

| Concern               | Development                       | Production                         |
| --------------------- | --------------------------------- | ---------------------------------- |
| Sanity project        | separate dev project (id via env) | separate prod project (id via env) |
| Sanity dataset        | `development`                     | `production`                       |
| Studio hostname       | `studio-dev.{your-hosting}`       | `studio.{your-hosting}`            |
| Vercel project (web)  | `blog-dev`                        | `blog-prod`                        |
| Vercel project (cms)  | `cms-dev`                         | `cms-prod`                         |
| Web URL (initial)     | `<DEV_WEB_URL>`                   | `<PRD_WEB_URL>`                    |
| Deploy trigger        | push/merge to `main`              | push git tag `v*`                  |
| Web deploy            | Vercel CLI (GitHub Actions)       | Vercel CLI (GitHub Actions)        |
| Studio deploy         | Vercel CLI (GitHub Actions)       | Vercel CLI (GitHub Actions)        |
| CI gate before deploy | `verify` job on `main`            | `verify` job on the `v*` tag       |
| Revalidation webhook  | dev → dev site                    | prod → prod site                   |

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
| Sanity **Migrate** token (Editor)          | `<DEV_MIGRATE_TOKEN>`     | `<PRD_MIGRATE_TOKEN>`     |
| Revalidate secret (`openssl rand -hex 32`) | `<DEV_REVALIDATE_SECRET>` | `<PRD_REVALIDATE_SECRET>` |

Vercel (needed for **both** environments — web and Studio each deploy via the
Vercel CLI in CI): `<VERCEL_TOKEN>` (account token) and `<VERCEL_ORG_ID>` are
shared across all four projects; `<VERCEL_PROJECT_ID>` is **per project**
(`blog-dev` / `blog-prod` from `vercel link`, `cms-dev` / `cms-prod`
likewise) — the web and Studio project ids are stored as two distinct
GitHub Environment variables (`VERCEL_PROJECT_ID` / `VERCEL_PROJECT_ID_CMS`).

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
  - [ ] `ci-migrate` — permission **Editor** → `<DEV_MIGRATE_TOKEN>` / `<PRD_MIGRATE_TOKEN>`.
        (Content migrations mutate documents; a read-only token can't. Least
        privilege, scoped to migrations only.)

> No `ci-deploy` / Deploy-Studio token anymore — Studio no longer deploys via
> `sanity deploy`, it's a static `sanity build` output served from Vercel (see
> below), so nothing needs Sanity's own deploy permission. If a project still
> has an old `ci-deploy` token from before this change, it can be revoked.

### 2. Secrets to generate locally

```sh
openssl rand -hex 32   # → DEV_REVALIDATE_SECRET
openssl rand -hex 32   # → PRD_REVALIDATE_SECRET
```

### 3. Vercel — four projects · https://vercel.com

Two projects per environment now — a web project (unchanged) and a Studio
project (new, replacing `*.sanity.studio` hosting):

- **Web:** `blog-dev`, `blog-prod` — Add New → Project → import
  `{github_account}/blog`; **Root Directory `apps/web`** + tick _"Include files
  outside of the root directory"_; **Node.js 22.x**.
- **Studio:** `cms-dev`, `cms-prod` — same import flow; **Root Directory
  `apps/cms`** + tick _"Include files outside of the root directory"_;
  **Node.js 22.x**; Framework Preset **Other** (the build/output commands
  come from `apps/cms/vercel.json`, not framework auto-detection).

All four projects have Vercel's Git auto-deploy **disabled** — every deploy
goes through a CI-gated GitHub Actions job (no pre-merge/preview deploys,
nothing deploys before checks pass). This is set **once, in code**, via each
app's own `vercel.json`'s `git.deploymentEnabled: false`
(`apps/web/vercel.json`, `apps/cms/vercel.json`) — since the two projects
sharing a Root Directory get the same committed file, it can't silently drift
the way a per-project console toggle (the old "Ignored Build Step" setting)
could — a missed one-time click on `blog-prod` once meant it deployed on
every branch push, uncontrolled, until #445 replaced it with this file.
Nothing to set per project in the dashboard for this anymore; only project
linking + domains remain:

- [ ] **`blog-dev`**
  - [ ] From repo root: `npx vercel link` → select `blog-dev`. Read the ids from
        `.vercel/project.json` → `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
        (Then delete the local `.vercel/` dir — it's gitignored scratch.)
- [ ] **`blog-prod`**
  - [ ] From repo root: `npx vercel link` → select `blog-prod`. Read the ids
        from `.vercel/project.json` → `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
        (Then delete the local `.vercel/` dir — it's gitignored scratch.)
- [ ] **`cms-dev`**
  - [ ] From repo root: `npx vercel link` → select `cms-dev`. Read
        `VERCEL_PROJECT_ID` from `.vercel/project.json` (`VERCEL_ORG_ID` is the
        same value already recorded for `blog-dev` — one Vercel account/team).
        (Then delete the local `.vercel/` dir.)
  - [ ] Settings → Domains → add `studio-dev.{your-hosting}`; add the DNS record
        it shows you (CNAME to `cname.vercel-dns.com`, or per Vercel's
        instructions) at whatever registrar/DNS host manages `{your-hosting}`.
- [ ] **`cms-prod`**
  - [ ] From repo root: `npx vercel link` → select `cms-prod`. Read
        `VERCEL_PROJECT_ID` from `.vercel/project.json`.
        (Then delete the local `.vercel/` dir.)
  - [ ] Settings → Domains → add `studio.{your-hosting}`; add the DNS record it
        shows you, same as above.

#### Vercel env vars

**Web** (`blog-dev` / `blog-prod`, Production + Preview scopes) — same five
keys per project; each project points at its **own** Sanity project, so the
id / dataset / URL / tokens all differ:

| Key                             | `blog-dev` value          | `blog-prod` value         |
| ------------------------------- | ------------------------- | ------------------------- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | `<DEV_PROJECT_ID>`        | `<PRD_PROJECT_ID>`        |
| `NEXT_PUBLIC_SANITY_DATASET`    | `development`             | `production`              |
| `NEXT_PUBLIC_SITE_URL`          | `https://<DEV_WEB_URL>`   | `https://<PRD_WEB_URL>`   |
| `SANITY_API_READ_TOKEN`         | `<DEV_READ_TOKEN>`        | `<PRD_READ_TOKEN>`        |
| `SANITY_REVALIDATE_SECRET`      | `<DEV_REVALIDATE_SECRET>` | `<PRD_REVALIDATE_SECRET>` |

> `SANITY_API_READ_TOKEN` is server-only (never exposed to the browser). Each
> project uses the Viewer token minted in its own Sanity project.

`@blog/db` (Neon Postgres, engagement layer — comments/ratings/auth/bookmarks/
subscribers, `SPEC.md` §4/§8) needs two connection strings, same Production +
Preview scopes as the five keys above:

| Key                           | `blog-dev` value              | `blog-prod` value             |
| ----------------------------- | ----------------------------- | ----------------------------- |
| `DATABASE_URL`                | `<DEV_DATABASE_URL>` (pooled) | `<PRD_DATABASE_URL>` (pooled) |
| `DATABASE_URL_UNPOOLED`       | `<DEV_DATABASE_URL_UNPOOLED>` | `<PRD_DATABASE_URL_UNPOOLED>` |
| `TENANT_TOKEN_ENCRYPTION_KEY` | `<DEV_TENANT_TOKEN_KEY>`      | `<PRD_TENANT_TOKEN_KEY>`      |

> `DATABASE_URL` (the pooled Neon HTTP driver, `drizzle-orm/neon-http`) is
> what the deployed app reads at runtime via `@blog/db`'s validated env entry
> point. `DATABASE_URL_UNPOOLED` (direct connection) is what `drizzle-kit`
> needs for `db:generate`/`db:migrate`/`db:studio` — `db:generate` never runs
> in CI (it's a local, human-review step), but `db:migrate` now runs
> automatically via the `migrate-db` job in `deploy-development.yml` (no
> approval gate) and `deploy-production.yml` (gated behind the `production`
> Environment's required reviewer, same gate every other prod job uses) —
> see `.claude/agents/db.md`'s "Migrations" section and "How a deploy
> happens" below. These two Vercel-scoped values and the GitHub Environment
> secret in §4 below are the same connection strings, just wired into two
> different systems — keep them in sync when a Neon branch's credentials
> rotate.

> `TENANT_TOKEN_ENCRYPTION_KEY` decrypts `tenants.sanityReadTokenEncrypted`
> (`@blog/utils`'s `encryptSecret`/`decryptSecret`, AES-256-GCM) — a 32-byte
> key, base64-encoded. Generate one per environment with
> `openssl rand -base64 32`; **dev and prod must use different keys.**
> Rotating this key means re-encrypting every tenant's stored token, so treat
> it with the same care as the read tokens it protects.

#### Neon Postgres — one project, per-branch environments

Unlike Sanity (a separate **project** per environment), Neon uses one project
with **branches**: a `development` branch backs `blog-dev`, a `production`
branch backs `blog-prod`. This repo's Neon project already exists and is
connected to both Vercel web projects (dev + prod) — provisioning notes for
recreating this from scratch:

- [ ] Neon console → create a project; add a `development` branch (or use
      the project's default branch as prod and branch `development` off it).
- [ ] Each branch → **Connection Details** gives both strings above: the
      pooled one (host ends `-pooler`) → `DATABASE_URL`, the direct one →
      `DATABASE_URL_UNPOOLED`.
- [ ] Wire them into the matching Vercel project's env vars (table above) —
      either by hand, or via Neon's Vercel integration (Vercel → Integrations
      → Neon), which can inject both automatically per Vercel environment.
- [ ] Enable `pgvector` (needed by M3.4 semantic search) once per branch —
      this repo's own migration does it
      (`packages/db/migrations/0000_enable_pgvector_extension.sql`); running
      `pnpm --filter @blog/db db:migrate` against a fresh branch (with
      `DATABASE_URL_UNPOOLED` sourced into the shell first) is sufficient, no
      manual `CREATE EXTENSION` step needed.

**Studio** (`cms-dev` / `cms-prod`, Production scope — `vercel pull
--environment=production` in CI only reads that scope): `sanity build`
(invoked by `apps/cms/vercel.json`'s `buildCommand`) loads `sanity.cli.ts`,
which requires these two:

| Key                        | `cms-dev` value    | `cms-prod` value   |
| -------------------------- | ------------------ | ------------------ |
| `SANITY_STUDIO_PROJECT_ID` | `<DEV_PROJECT_ID>` | `<PRD_PROJECT_ID>` |
| `SANITY_STUDIO_DATASET`    | `development`      | `production`       |

### 4. GitHub Actions — environment-scoped variables & secrets

The deploy jobs run in the `development` / `production` **GitHub Environments**,
so set these per environment (Settings → Environments → `<env>`) — that's how each
job resolves its own project's id + token:

**`development` environment**

- [ ] Variable `SANITY_STUDIO_PROJECT_ID` = `<DEV_PROJECT_ID>`
- [ ] Secret `SANITY_MIGRATE_TOKEN` = `<DEV_MIGRATE_TOKEN>` (Editor — the migrate job)
- [ ] Secret `DATABASE_URL_UNPOOLED` = `<DEV_DATABASE_URL_UNPOOLED>` (the `development`
      Neon branch's direct connection string — the `migrate-db` job's
      `drizzle-kit migrate`; same value as the Vercel env var above)
- [ ] Secret `VERCEL_TOKEN` = `<VERCEL_TOKEN>`
- [ ] Variable `VERCEL_ORG_ID` = `<VERCEL_ORG_ID>`
- [ ] Variable `VERCEL_PROJECT_ID` = `<VERCEL_PROJECT_ID>` (**blog-dev**)
- [ ] Variable `VERCEL_PROJECT_ID_CMS` = `<VERCEL_PROJECT_ID>` (**cms-dev**)

**`production` environment**

- [ ] Variable `SANITY_STUDIO_PROJECT_ID` = `<PRD_PROJECT_ID>`
- [ ] Secret `SANITY_MIGRATE_TOKEN` = `<PRD_MIGRATE_TOKEN>` (Editor — the migrate job)
- [ ] Secret `DATABASE_URL_UNPOOLED` = `<PRD_DATABASE_URL_UNPOOLED>` (the `production`
      Neon branch's direct connection string — the `migrate-db` job's
      `pg_dump` backup + `drizzle-kit migrate`; same value as the Vercel env
      var above)
- [ ] Secret `VERCEL_TOKEN` = `<VERCEL_TOKEN>`
- [ ] Variable `VERCEL_ORG_ID` = `<VERCEL_ORG_ID>`
- [ ] Variable `VERCEL_PROJECT_ID` = `<VERCEL_PROJECT_ID>` (**blog-prod**)
- [ ] Variable `VERCEL_PROJECT_ID_CMS` = `<VERCEL_PROJECT_ID>` (**cms-prod**)
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
- [ ] Secret `SANITY_DEV_IMPORT_TOKEN` = `<DEV_IMPORT_TOKEN>` (**Editor** — the
      script wipes documents and imports, it never deletes/creates the
      dataset itself, so no dataset-management grant is needed)
- [ ] (Recommended) require a reviewer on `dataset-refresh` — an extra human
      gate before the job wipes and replaces every document in `development`.

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
- [ ] `https://studio-dev.{your-hosting}` — credentials **on** (dev project).
- [ ] `https://studio.{your-hosting}` — credentials **on** (prod project).
- [ ] `https://<DEV_WEB_URL>` — credentials **off** (token reads).
- [ ] `https://<PRD_WEB_URL>` — credentials **off**.
- [ ] Remove the old `https://valovinnikov-blog-dev.sanity.studio` /
      `https://valovinnikov-blog.sanity.studio` origins once the Vercel-hosted
      Studio at the new domain is confirmed working (see "Decommissioning the
      old `*.sanity.studio` Studio" below).

### 6a. Decommissioning the old `*.sanity.studio` Studio

Once `studio.{your-hosting}` / `studio-dev.{your-hosting}` are live and verified
(Studio loads, signs in, and can read/write the correct dataset):

- [ ] From `apps/cms`, with each project's env pointed at it (`SANITY_STUDIO_HOSTNAME`
      is required here — `sanity undeploy` errors with "No application ID or
      studio host provided" without it, even though nothing deploys with it
      set anymore):
      `SANITY_STUDIO_PROJECT_ID=<PRD_PROJECT_ID> SANITY_STUDIO_DATASET=production SANITY_STUDIO_HOSTNAME=valovinnikov-blog pnpm exec sanity undeploy`
      (repeat for dev with `<DEV_PROJECT_ID>` / `development` /
      `valovinnikov-blog-dev`). This removes the `*.sanity.studio` hosted
      deployment; the Studio itself (project, dataset, content) is untouched —
      only the old hosting target goes away.
- [ ] Remove the two old CORS origins (previous checklist item).
- [ ] Revoke any leftover `ci-deploy` Sanity token (§1) if one still exists —
      nothing uses it anymore.

### 7. Local dev configuration

Local dev points at the **dev** project (`<DEV_PROJECT_ID>`):

- [ ] `apps/cms/.env` (gitignored): `SANITY_STUDIO_PROJECT_ID=<DEV_PROJECT_ID>`,
      `SANITY_STUDIO_DATASET=development`.
- [ ] `apps/web/.env.local` (gitignored): `NEXT_PUBLIC_SANITY_PROJECT_ID=<DEV_PROJECT_ID>`,
      `NEXT_PUBLIC_SANITY_DATASET=development`, and optionally
      `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.
- [ ] (Optional) seed the dev `development` dataset — author fresh content in the
      dev Studio, or export/import from another dataset. It's empty until seeded.
- [ ] `apps/web/.env.local` also carries `DATABASE_URL=<DEV_DATABASE_URL>` and
      `DATABASE_URL_UNPOOLED=<DEV_DATABASE_URL_UNPOOLED>` (the `development`
      Neon branch's pooled/unpooled connection strings) — the single local
      source `@blog/db`'s `drizzle.config.ts` and runtime client both expect.
      `packages/db`'s own CLI (`db:generate`/`db:migrate`/`db:studio`) runs
      standalone via `pnpm --filter @blog/db db:*`, outside Next's own env
      loading, so source these into the shell first:
      `set -a && source apps/web/.env.local && set +a`.

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
   deploy that depends on it); `deploy-studio` `needs: [changes, verify,
migrate]` and `deploy-web` `needs: [changes, verify, migrate, migrate-db]`
   (see step 4 below for why only `deploy-web` also needs `migrate-db`). No
   artifact backup here — dev is the disposable staging line (see "Refreshing
   development from production"
   below for the manual post-migration refresh); the job is guarded on
   `SANITY_MIGRATE_TOKEN`, so it's inert until that secret exists. **No
   approval gate on dev** (unlike prod) — dev auto-migrates.
4. **`migrate-db`** (`environment: development`) — the same idea as `migrate`
   above, for the separate `@blog/db` (Drizzle/Neon) relational store: applies
   any un-applied schema migrations to the **development** Neon branch via
   `pnpm --filter @blog/db db:migrate` (`drizzle-kit migrate`, a no-op when
   none are pending). Gated on `needs.changes.outputs.web` only (apps/cms
   never touches Postgres, so a cms-only change doesn't trigger it); only
   `deploy-web` `needs` it (not `deploy-studio`). No artifact backup here,
   same disposable-staging-line stance as `migrate`; guarded on
   `DATABASE_URL_UNPOOLED`, so it's inert until that secret exists. **No
   approval gate on dev.** See `.claude/agents/db.md`'s "Migrations" section.
5. **`deploy-studio`** → `cms-dev` via the Vercel CLI (`studio-dev.{your-hosting}`),
   same mechanism as `deploy-web`.
6. **`deploy-web`** → `blog-dev` via the Vercel CLI
   (`vercel pull → build --prod → deploy --prebuilt --prod`).

Concurrency is scoped **per job**, not workflow-wide. `changes` / `verify` /
`deploy-*` each keep `cancel-in-progress: true`, so a newer merge still
supersedes an in-flight build/deploy — "latest merge wins" still holds. (The
supersede is slightly lazier than the old workflow-level cancel: a per-job
group cancels an older run's `deploy-web`/`deploy-studio` only once the newer
run's _same_ job is ready to start — i.e. after the newer run clears its own
`changes` → `verify` → `migrate`/`migrate-db` chain — so an old deploy can
finish before being superseded rather than being cut off the instant a new
run starts.) `migrate` and `migrate-db` are the exception — both groups use
`cancel-in-progress: false` (#409), so a newer merge **queues behind** a
running migration instead of interrupting a mutation mid-transaction. GitHub
keeps at most one pending run per group, so a burst of merges collapses to
"finish the current migration, then run the latest".

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
   approval gate. Every step is guarded on `SANITY_MIGRATE_TOKEN`, so the job is a
   **no-op until that secret is configured** — safe to ship ahead of setup.
3. **`migrate-db`** (`environment: production`, `needs: verify`) — the same
   idea as `migrate` above, for the separate `@blog/db` (Drizzle/Neon)
   relational store: `pg_dump`s the production Neon branch and uploads it as
   a 30-day artifact **before** any mutation, then runs
   `pnpm --filter @blog/db db:migrate` (`drizzle-kit migrate`) to apply only
   the un-applied schema migrations (tracked in drizzle-kit's own journal
   under `packages/db/migrations/meta`, idempotent). Reuses the **same**
   `production` Environment required-reviewer gate as every other prod job —
   no second approval mechanism. Every step is guarded on
   `DATABASE_URL_UNPOOLED`, so the job is a **no-op until that secret is
   configured** — safe to ship ahead of setup. Only `deploy-web` `needs` it
   (apps/cms never touches Postgres). See `.claude/agents/db.md`'s
   "Migrations" section.
4. **`deploy-studio`** → `cms-prod` via the Vercel CLI (`studio.{your-hosting}`),
   same mechanism as `deploy-web`.
5. **`deploy-web`** → `blog-prod` via the Vercel CLI
   (`vercel pull → build --prod → deploy --prebuilt --prod`).

`deploy-studio` `needs: [verify, migrate]`; `deploy-web` `needs: [verify,
migrate, migrate-db]` — so **new code is never served before pending
migrations run**; a failed or reviewer-rejected `migrate`/`migrate-db` skips
the deploy(s) that depend on it, leaving the old code serving the old
(un-migrated) data.

### Refreshing development from production (manual, post-migration)

The `development` dataset drifts from real content over time. `.github/workflows/refresh-dev-dataset.yml`
(`workflow_dispatch` only — never automatic, never part of a deploy) replaces
`development` with a fresh copy of `production`, cross-project (dev and prod
are separate Sanity projects, so this is an export→import, not
`sanity dataset copy`). Published documents only — drafts are excluded.
Assets are included; since every document in the target dataset is wiped
before each run (assets are documents too), there's no cross-run asset
accumulation.

**Run this only after that release's production migrations have completed**
(step 2 above) — refreshing from a not-yet-migrated `production` would copy
pre-migration shapes that no longer match the deployed schema:

1. Confirm the `production` deploy's `migrate` job finished (Actions tab).
2. Actions → **Refresh Dev Dataset** → **Run workflow** (`main`).
3. The job exports `production` (published-only), wipes every document in
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

- [ ] Vercel → Add New → Project → import `{github_account}/blog`; **Root
      Directory `packages/ui`** + tick _"Include files outside of the root
      directory"_; **Node.js 22.x**; Framework Preset **Other** (build/output
      commands come from `packages/ui/vercel.json`).
- [ ] Confirm Git integration is **enabled**, with PR previews **on** — this
      is the default for a newly imported project; the point is to leave it
      as-is, unlike every other project above.
- [ ] Settings → Domains → add `ui-library.{your_hosting}` (production
      deployment only — previews keep Vercel's own auto-generated URLs); add
      the DNS record it shows you at whatever registrar/DNS host manages
      `{your_hosting}`.
- [ ] No env vars, no CORS, no tokens — `@blog/ui` never imports `service` or
      touches Sanity, so nothing here needs the Sanity/Vercel credential
      dance the rest of this doc walks through.

### `apps/web`'s own Storybook (second, separate hosted project)

Same idea, mirrored for `apps/web`'s own stories (#1573) — a broken story
there needs the same pre-merge visual signal as `@blog/ui`, and the hosted
`packages/ui` project above only ever builds `packages/ui`'s Storybook (its
Root Directory scopes it there), so nothing else covers `apps/web`'s.

One difference from the `packages/ui` setup: this project's build config
can't live in `apps/web/vercel.json` — that file already belongs to the
primary `blog-web-dev`/`blog-web-prod` project (`git.deploymentEnabled:
false`, keeping its Git auto-deploy off in favor of the CI-gated pipeline),
and Vercel reads one `vercel.json` per Root Directory regardless of which
project is asking — a second project also rooted at `apps/web` would inherit
that same `deploymentEnabled: false` and silently never deploy. Config
instead lives in a **repo-root `vercel.json`** (a new file, distinct from
every package's own), with the Root Directory set to the repo root itself:

- [ ] Vercel → Add New → Project → import `{github_account}/blog`; **Root
      Directory** left at the repo root (`.`) — do **not** set it to
      `apps/web`; **Node.js 22.x**; Framework Preset **Other** (build/output
      commands come from the root `vercel.json`).
- [ ] Confirm Git integration is **enabled**, with PR previews **on** — same
      as the `packages/ui` project above.
- [ ] Settings → Domains → add `web-storybook.{your_hosting}` (production
      deployment only); add the DNS record at whatever registrar/DNS host
      manages `{your_hosting}`.
- [ ] No env vars, no CORS, no tokens — `apps/web`'s stories are
      component-level (no full-page compositions that would fetch live
      Sanity content), so this needs nothing the `packages/ui` project
      above doesn't already skip.
