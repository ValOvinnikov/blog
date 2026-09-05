# Deploy & release runbook

How this blog deploys, and the one-time setup that makes the pipeline live.

- **Local dev + every `main` merge** → **development** environment
  (`development` dataset).
- **Push a `vX.Y.Z` git tag** → **production** environment (`production`
  dataset).

On a `main` merge, the Next.js **web app** and the **admin panel** each deploy
only when the merge touches their turbo graph (`turbo-ignore`; a manual
`workflow_dispatch` run deploys both). A production tag has no such gate and
always deploys both. The Studio is not a deploy target — it ships as the
`@blog/studio` package and is mounted by the admin panel; change detection
still tracks it, but only to decide whether the Sanity content-migration job
needs to run.
Architecture rationale lives in `SPEC.md` §13 and
`docs/archive/superpowers/specs/2026-07-13-multi-env-release-pipeline-design.md`.

> **Each environment is a separate Sanity project** (one per environment) — not
> one project with two datasets. Project ids stay **env-driven and are never
> committed** (this repo hardcodes no Sanity ids — see `<DEV_PROJECT_ID>` /
> `<PRD_PROJECT_ID>` below). Because Sanity **tokens are project-scoped**, dev and
> prod each need their own read + deploy tokens, wired as **environment-scoped**
> GitHub secrets/variables (the `development` / `production` GitHub Environments),
> not repo-level. `web-dev` and `web-prod` likewise point
> `NEXT_PUBLIC_SANITY_PROJECT_ID` at different project ids.

---

## Environment matrix

| Concern                | Development                       | Production                         |
| ---------------------- | --------------------------------- | ---------------------------------- |
| Sanity project         | separate dev project (id via env) | separate prod project (id via env) |
| Sanity dataset         | `development`                     | `production`                       |
| Vercel project (web)   | `web-dev`                         | `web-prod`                         |
| Vercel project (admin) | `platform-dev`                    | `platform-prod`                    |
| Web URL (initial)      | `<DEV_WEB_URL>`                   | `<PRD_WEB_URL>`                    |
| Admin URL (initial)    | `<DEV_ADMIN_URL>`                 | `<PRD_ADMIN_URL>`                  |
| Deploy trigger         | push/merge to `main`              | push git tag `v*`                  |
| Web deploy             | Vercel CLI (GitHub Actions)       | Vercel CLI (GitHub Actions)        |
| Admin deploy           | Vercel CLI (GitHub Actions)       | Vercel CLI (GitHub Actions)        |
| CI gate before deploy  | `verify` job on `main`            | `verify` job on the `v*` tag       |
| Revalidation webhook   | dev → dev site                    | prod → prod site                   |

> **Project name vs. hostname.** The Vercel _projects_ are named `web-dev`/`web-prod` and `platform-dev`/`platform-prod`; the _hostnames_ they serve are `blog-dev.{your-hosting}` and `admin-dev.{your-hosting}` (and the apex plus `admin.{your-hosting}` in production). The gap is deliberate and it widened when the projects were renamed off their `blog-` prefix (#2426): the product is no longer a blog, but the hostnames are live DNS records wired into OAuth callback registrations, so renaming them is separate work with its own checklist — not a side effect of tidying project names. Both forms appear in this file on purpose: `vercel link` and the project settings use the project name, while anything you visit in a browser uses the hostname. The two Storybook projects follow the same split — `ui-library` happens to match its `ui-library.{your_hosting}` hostname, while `web-ui-library`'s intended hostname, `web-storybook.{your_hosting}`, is not attached to it yet and does not resolve.

> `<DEV_ADMIN_URL>` / `<PRD_ADMIN_URL>` are the admin panel's equivalents, on
> its own two projects.
>
> `<DEV_WEB_URL>` / `<PRD_WEB_URL>` are each project's `*.vercel.app` URL — either
> the auto-assigned one (e.g. `web-<random>.vercel.app`) or a stable alias you
> add in Vercel → Settings → Domains. Use the same value in `NEXT_PUBLIC_SITE_URL`,
> the CORS origin, and the webhook URL. Custom domains are deferred (#275).

---

## Values scratchpad

Collect these **per environment** — dev and prod are separate Sanity projects, so
the project id and all tokens differ. The `<PLACEHOLDER>` names are used only
within this doc; the real values live in GitHub / Vercel / local `.env` and are
**never committed** (project ids included).

| What                                                   | Development                | Production                 |
| ------------------------------------------------------ | -------------------------- | -------------------------- |
| Sanity project id (public)                             | `<DEV_PROJECT_ID>`         | `<PRD_PROJECT_ID>`         |
| Sanity dataset                                         | `development`              | `production`               |
| Sanity **Viewer** token                                | `<DEV_READ_TOKEN>`         | `<PRD_READ_TOKEN>`         |
| Sanity **Migrate** token (Editor)                      | `<DEV_MIGRATE_TOKEN>`      | `<PRD_MIGRATE_TOKEN>`      |
| Revalidate secret (`openssl rand -hex 32`)             | `<DEV_REVALIDATE_SECRET>`  | `<PRD_REVALIDATE_SECRET>`  |
| Site-config revalidate secret (`openssl rand -hex 32`) | `<DEV_SITE_CONFIG_SECRET>` | `<PRD_SITE_CONFIG_SECRET>` |

Vercel (needed for **both** environments — the web app and the admin panel each
deploy via the Vercel CLI in CI): `<VERCEL_TOKEN>` (account token) and
`<VERCEL_ORG_ID>` are shared across all four projects; `<VERCEL_PROJECT_ID>` is
**per project** (`web-dev` / `web-prod` and `platform-dev` / `platform-prod`, each
read from `vercel link`) — the web and admin project ids are stored as two
distinct GitHub Environment variables (`VERCEL_PROJECT_ID_WEB` /
`VERCEL_PROJECT_ID_PLATFORM`).

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

> No `ci-deploy` / Deploy-Studio token anymore — the Studio is not deployed at
> all: it ships as the `@blog/studio` package and is mounted by the admin
> panel, so nothing needs Sanity's own deploy permission. If a project still
> has an old `ci-deploy` token from before this change, it can be revoked.

### 2. Secrets to generate locally

```sh
openssl rand -hex 32   # → DEV_REVALIDATE_SECRET
openssl rand -hex 32   # → PRD_REVALIDATE_SECRET
openssl rand -hex 32   # → DEV_SITE_CONFIG_SECRET
openssl rand -hex 32   # → PRD_SITE_CONFIG_SECRET
```

`SITE_CONFIG_REVALIDATE_SECRET` is a shared bearer token between this repo's
own two apps — `apps/platform` sends it, `apps/web` compares it. Nothing
external issues or validates it, so rotating it means generating a new value
and replacing it in both places; there is nothing to recover if the old value
is lost.

**Each value goes on both projects of its pair** (`web-dev` **and**
`platform-dev`; `web-prod` **and** `platform-prod`). Setting it on only
one side is worse than setting it on neither: `apps/platform` skips the call
only when its own copy is absent, so a panel that has the secret POSTs to a
site that does not. The save itself has already committed by then — the
operator sees success while the background revalidation POST takes a 500 and
the site quietly goes stale until the fallback window expires. Dev and prod
take different values.

### 3. Vercel — four projects · https://vercel.com

Two projects per environment — a web project and an admin-panel project. The
Studio is no longer a deploy target of its own: it ships as the `@blog/studio`
package and is mounted by the admin panel, so it has no project, no hostname
and no deploy job.

- **Web:** `web-dev`, `web-prod` — Add New → Project → import
  `{github_account}/blog`; **Root Directory `apps/web`** + tick _"Include files
  outside of the root directory"_; **Node.js 24.x**.
- **Admin:** `platform-dev`, `platform-prod` — same import flow; **Root Directory
  `apps/platform`** + tick _"Include files outside of the root directory"_;
  **Node.js 24.x**. A separate project rather than a second domain on
  `web-dev`/`web-prod`: a Vercel project has exactly one Root Directory,
  and the panel is a second Next.js app under `apps/platform`.

`web-*` and `platform-*` have Vercel's Git auto-deploy **disabled** — every deploy
goes through a CI-gated GitHub Actions job (no pre-merge/preview deploys,
nothing deploys before checks pass). This is set **once, in code**, via each
app's own `vercel.json`'s `git.deploymentEnabled: false` (`apps/web`,
`apps/platform`) — since the two projects sharing a Root Directory
get the same committed file, it can't silently drift the way a per-project
console toggle (the old "Ignored Build Step" setting) could — a missed
one-time click on `web-prod` once meant it deployed on every branch push,
uncontrolled, until #445 replaced it with this file.

`apps/platform` was considered for branch previews (a panel whose purpose is
_saving_ config is the one surface a pre-merge preview would genuinely help
review) and deliberately left disabled: each preview gets its own
`*.vercel.app` hostname, and signing in on one would mean registering that
exact callback URL with both the GitHub and Google OAuth apps — neither
supports wildcards — for every branch. A session can't carry over from the
real admin domain either, since `AUTH_COOKIE_DOMAIN` (below) cannot be scoped
to `vercel.app`, which is on the Public Suffix List. A preview you can't sign
in to can't be reviewed, so previews would cost a standing OAuth chore and a
new grant of preview database access while delivering nothing. Admin changes
are reviewed on `admin-dev.{your-hosting}`, which deploys automatically on
merge.

Nothing to set per project in the dashboard for this anymore; only project
linking + domains remain:

- [ ] **`web-dev`**
  - [ ] From repo root: `npx vercel link` → select `web-dev`. Read the ids from
        `.vercel/project.json` → `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID_WEB`.
        (Then delete the local `.vercel/` dir — it's gitignored scratch.)
- [ ] **`web-prod`**
  - [ ] From repo root: `npx vercel link` → select `web-prod`. Read the ids
        from `.vercel/project.json` → `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID_WEB`.
        (Then delete the local `.vercel/` dir — it's gitignored scratch.)
- [ ] **`platform-dev`**
  - [ ] From repo root: `npx vercel link` → select `platform-dev`. Read
        `VERCEL_PROJECT_ID` from `.vercel/project.json` → this is
        `VERCEL_PROJECT_ID_PLATFORM` for the `development` GitHub Environment.
        (Then delete the local `.vercel/` dir.)
  - [ ] Settings → Domains → add `admin-dev.{your-hosting}`; add the DNS record
        it shows you, same as above.
- [ ] **`platform-prod`**
  - [ ] From repo root: `npx vercel link` → select `platform-prod`. Read
        `VERCEL_PROJECT_ID` from `.vercel/project.json` → this is
        `VERCEL_PROJECT_ID_PLATFORM` for the `production` GitHub Environment.
        (Then delete the local `.vercel/` dir.)
  - [ ] Settings → Domains → add `admin.{your-hosting}`; add the DNS record it
        shows you, same as above. This must match the `ADMIN_APP_BASE_URL`
        Variable in §4 exactly (no trailing slash).

#### Vercel env vars

**Web** (`web-dev` / `web-prod`, Production scope — `deploy-development.yml`
and `deploy-production.yml` both run `vercel pull --environment=production`
before `vercel build`, so a var scoped only to Preview/Development is never
pulled, and — for a required key like `DATABASE_URL` — the app fails at its
eager `@blog/db` validation rather than silently degrading; same reasoning as
the Preview-scope note below) — same six keys per project; each project
points at its **own** Sanity project, so the id / dataset / URL / tokens all
differ:

| Key                             | `web-dev` value            | `web-prod` value           |
| ------------------------------- | -------------------------- | -------------------------- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | `<DEV_PROJECT_ID>`         | `<PRD_PROJECT_ID>`         |
| `NEXT_PUBLIC_SANITY_DATASET`    | `development`              | `production`               |
| `NEXT_PUBLIC_SITE_URL`          | `https://<DEV_WEB_URL>`    | `https://<PRD_WEB_URL>`    |
| `SANITY_API_READ_TOKEN`         | `<DEV_READ_TOKEN>`         | `<PRD_READ_TOKEN>`         |
| `SANITY_REVALIDATE_SECRET`      | `<DEV_REVALIDATE_SECRET>`  | `<PRD_REVALIDATE_SECRET>`  |
| `SITE_CONFIG_REVALIDATE_SECRET` | `<DEV_SITE_CONFIG_SECRET>` | `<PRD_SITE_CONFIG_SECRET>` |

> `SANITY_API_READ_TOKEN` is server-only (never exposed to the browser). Each
> project uses the Viewer token minted in its own Sanity project.

> **Nothing here belongs in the Preview scope.** All four pipeline projects
> disable Git auto-deploy, so none of them ever produces a preview
> deployment — a Preview-scoped value would simply never be read. This also
> means no unreviewed branch has ever been able to reach a database through
> this repo's projects, and that property is worth keeping: `DATABASE_URL` is
> Production-scoped everywhere, and widening it is a deliberate decision, not
> a setup detail. (The two Storybook projects do preview-deploy, but they hold
> no database or token config at all.)

`@blog/db` (Neon Postgres, engagement layer — comments/ratings/auth/bookmarks/
subscribers, `SPEC.md` §4/§8) needs two connection strings, same Production
scope as the five keys above:

| Key                           | `web-dev` value               | `web-prod` value              |
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
with **branches**. This repo's Neon project has two today: `main` (the
project's original/default branch, backing production) and `development`
(branched off `main` on 2026-08-25, backing `web-dev`). Before that date only
`main` existed and both environments read it — `development`'s data started as
whatever `main` held at branch time, not a synced or continuously-refreshed
copy (that's a separate, Sanity-only workflow — see "Refreshing development
from production" further down, which does not touch Neon at all).

**Which secret targets which branch — verify this, don't assume it.** The
two-branch split is recent and the secret wiring has not fully caught up:

- `deploy-development.yml`'s `migrate-db` job reads the `development`
  Environment's own `DATABASE_URL_UNPOOLED`. Whether that secret was
  repointed at the new `development` branch (rather than left over from when
  only `main` existed) can't be confirmed by reading the secret back — GitHub
  never allows that — but the job guards against the dangerous case going
  forward: it fails loudly if this secret ever resolves to the production
  branch's host, and fails loudly too if `PRODUCTION_DB_HOST` itself is unset
  or malformed — it's no longer possible to leave the guard silently inert
  (see "Repo level — production-target guard for `migrate-db` (both
  directions)" further down).
- `deploy-production.yml`'s `migrate-db` job reads the `production`
  Environment's `DATABASE_URL_UNPOOLED` — intended to be the `main` branch.
  It carries the mirror-image guard (#2264): it fails loudly if this secret
  ever resolves to anything **other than** `PRODUCTION_DB_HOST` — the earlier
  asymmetry, where a mis-set production secret would migrate the wrong branch
  with no backup and no failure, no longer exists. The tenant lifecycle
  workflows never read this secret at all, deliberately, so a tenant-registry
  dispatch can never repoint a deploy job's migration: all tenant
  lifecycle workflows bind to whichever Environment their dispatch's
  `environment` input names and read that Environment's own
  `TENANT_REGISTRY_DATABASE_URL` secret instead (§4 below).
  `recheck-tenant-owners.yml` additionally falls back to `production` when
  that input is absent, which is every `schedule`-triggered sweep. The two purposes — tenant registry and deploy migration — used to
  share one secret until #2056 split them apart, after pointing it at
  `development` to unblock tenant provisioning from `admin-dev.{your-hosting}`
  had silently repointed a production tag's `migrate-db` step at
  `development` too, leaving `main` unmigrated while reporting success — the
  same silent-wrong-branch failure mode #2264's guard now catches
  structurally, not just for this one incident's specific cause.
- `web-dev`'s Vercel `DATABASE_URL` may be scoped to Preview+Development
  rather than Production; `deploy-development.yml` builds via
  `vercel pull --environment=production`, which would not read a
  Preview+Development-scoped value. Unconfirmed whether this breaks any live
  route on `blog-dev.{your-hosting}` — tracked in #2058.

**Pooled vs. unpooled — the distinction that caused confusion during setup.**
Neon gives each branch two connection strings from **Connection details**: a
**pooled** one (host ends `-pooler`, routed through PgBouncer) and a
**direct/unpooled** one. They are not interchangeable:

- `DATABASE_URL` (pooled) is what the deployed app reads at runtime via
  `@blog/db`'s `drizzle-orm/neon-http` client — a serverless function opens
  many short-lived connections, and only the pooler tolerates that load.
- `DATABASE_URL_UNPOOLED` (direct) is what `drizzle-kit`
  (`db:generate`/`db:migrate`/`db:studio`) and `pg_dump` need — a migration or
  dump needs a session-level connection the pooler doesn't provide.

Pointing a migration job at the pooled string, or the runtime client at the
unpooled one, fails outright or degrades silently under load. That is a
different axis of confusion than the branch mix-up above, but the two compound
easily during setup — always confirm **both** which branch and which
connection mode a value came from before pasting it into a secret.

Provisioning notes for recreating this from scratch:

- [ ] Neon console → create a project; add a `development` branch off the
      project's default branch (which becomes production — Neon doesn't
      require it to be named `main` or `production`, but this repo's default
      branch is in fact named `main`).
- [ ] Each branch → **Connection Details** gives both strings above: the
      pooled one (host ends `-pooler`) → `DATABASE_URL`, the direct one →
      `DATABASE_URL_UNPOOLED`.
- [ ] Wire them into the matching Vercel project's env vars (table above) —
      either by hand, or via Neon's Vercel integration (Vercel → Integrations
      → Neon), which can inject both automatically per Vercel environment. Set
      each at **Production** scope (see the note under the web env var table
      above) and re-check the scope after saving — it has silently defaulted
      to Preview+Development before (#2058).
- [ ] Wire the same two branches' connection strings into the matching GitHub
      Environment secrets (§4 below) — `development` Environment's
      `DATABASE_URL_UNPOOLED` → the `development` branch, `production`
      Environment's → the `main` branch. Confirm each by running a migration
      against the branch you think you're targeting and checking its row
      counts/timestamps, not by trusting the secret's name.
- [ ] Enable `pgvector` (needed by M3.4 semantic search) once per branch —
      this repo's own migration does it
      (`packages/db/migrations/0000_enable_pgvector_extension.sql`); running
      `pnpm --filter @blog/db db:migrate` against a fresh branch (with
      `DATABASE_URL_UNPOOLED` sourced into the shell first) is sufficient, no
      manual `CREATE EXTENSION` step needed.
- [ ] Double-check each GitHub Environment's `DATABASE_URL_UNPOOLED` secret
      (§4 below) actually points at that environment's own branch —
      `development`'s at the `development` branch, `production`'s at the
      `production` branch. GitHub never lets you read a secret back once set,
      so this only catches a copy-paste swap by re-pasting from the Neon
      console at set time, or by setting `PRODUCTION_DB_HOST` (see the "Repo
      level — production-target guard for `migrate-db` (both directions)"
      checklist further down) so a mis-set `development` secret fails the
      `migrate-db` job loudly instead of silently migrating production, and a
      mis-set `production` secret fails it loudly instead of silently
      migrating the wrong branch (or nothing at all) while reporting success.

**Admin** (`platform-dev` / `platform-prod`, Production scope). The panel runs its
**own** Node process, so it needs
its own copy of every variable it reads: `@blog/auth` declares the auth set
with `runtimeEnv: process.env` and neither app declares them itself any more
(#1457), so extracting the shared package moved where these are _declared_,
not where they are _needed_. It never touches Sanity, so none of the
`SANITY_*` keys belong here.

Required — the app cannot serve without these:

| Key            | `platform-dev` value          | `platform-prod` value         |
| -------------- | ----------------------------- | ----------------------------- |
| `AUTH_SECRET`  | same value as `web-dev`'s     | same value as `web-prod`'s    |
| `DATABASE_URL` | `<DEV_DATABASE_URL>` (pooled) | `<PRD_DATABASE_URL>` (pooled) |

> **Keep `AUTH_SECRET` byte-identical to the paired web project's** — but
> know why, because the reason is not the one this file used to give. Under
> `session.strategy: 'database'` the secret does _not_ validate the session
> cookie: that is an opaque token resolved by a `sessions` table lookup. What
> it does salt — the magic-link verification-token hash and the CSRF token
> hash — is in every case created and verified inside a single app's own
> process, so **no mechanism in this repo is currently known to require the
> two apps' values to match.** Holding them on one value is a deliberate
> operational stance, not a functional dependency: one secret to rotate, and
> no hidden coupling if the session or cookie arrangement ever changes.
>
> What a mismatch _does_ break is same-app: a secret that changes between
> issuing a token and verifying it — a rotation mid-flight — invalidates
> in-flight magic links and CSRF checks with no error, no type failure and no
> failing test.
>
> It is **not** what makes a sign-in span both origins — that is cookie
> scope, and `AUTH_COOKIE_DOMAIN` is deliberately unset (see below), so each
> origin is signed into separately even with matching secrets.

Optional — each is feature-flag-by-absence (the surface it powers degrades
with a logged, readable error rather than crashing the app), but the panel is
not fully functional until they are set:

| Key                                | Purpose                                                              |
| ---------------------------------- | -------------------------------------------------------------------- |
| `AUTH_GITHUB_ID` / `_SECRET`       | GitHub sign-in (`@blog/auth`)                                        |
| `AUTH_GOOGLE_ID` / `_SECRET`       | Google sign-in (`@blog/auth`)                                        |
| `MAGIC_LINK_FROM_ADDRESS`          | magic-link sender address (`@blog/auth`)                             |
| `AUTH_COOKIE_DOMAIN`               | deliberately unset — see below                                       |
| `RESEND_API_KEY`                   | delivers the magic-link email (`apps/platform`'s own `sendEmail`)    |
| `BLOB_READ_WRITE_TOKEN`            | Look tab's logo/favicon uploads (`@vercel/blob`)                     |
| `WEB_APP_URL`                      | `apps/web` origin the Look/Voice saves call to revalidate its cache  |
| `SITE_CONFIG_REVALIDATE_SECRET`    | bearer token for that call — byte-identical to `apps/web`'s own      |
| `TENANT_PROVISIONING_GITHUB_TOKEN` | `actions: write`-only PAT that dispatches (de)provisioning workflows |
| `TENANT_PROVISIONING_GITHUB_REPO`  | `owner/repo` those dispatches target                                 |
| `TENANT_PROVISIONING_DATASET`      | which dataset new tenants' Sanity projects are created in            |
| `VERCEL_API_TOKEN`                 | read-scoped token for the tenant status page's live domain check     |
| `VERCEL_PROJECT_ID_WEB`            | the shared `apps/web` project id that check runs against             |
| `VERCEL_TEAM_ID`                   | only when the Vercel account is team-owned                           |

**`AUTH_COOKIE_DOMAIN` is deliberately left unset on the development pair** —
decided 2026-09-01 (#2399). Unset, `@blog/auth` sets no cookie options at all
and each origin keeps its own session: you sign in once on the site and again
on the panel. That is the intended behaviour, not an oversight, and the
verification checklists below reflect it. The production pair is assessed
separately, but the hazard below applies there identically.

Setting it would scope the session cookie to a shared parent domain so one
sign-in covered both origins — but **that parent cannot be the apex domain
this deployment already uses.** Every surface hangs off a single apex: the
production site is the apex itself, and the dev pair, every tenant site and
the hosted Storybook are subdomains of it (the production admin panel has no
custom domain assigned yet, but the plan puts it on that apex too).

`@blog/auth` hardcodes one cookie name across all deployments, so a cookie
scoped to the apex would be a **single browser cookie** shared by
development, production and every tenant. Under `session.strategy:
'database'` that cookie is an opaque token resolved by a `sessions` table
lookup, and dev and production run separate Neon branches — so signing in on
dev overwrites the cookie production is using, production's lookup then finds
no matching row, and you are silently signed out there. The same cookie would
also be transmitted to every tenant site. Enabling cross-app sessions
therefore requires first giving each environment its own parent domain
(`.{env}.{your-hosting}`, so dev and prod cookies cannot collide) or making the
cookie name environment-specific — setting this variable alone is not enough.

It also must stay **unset** anywhere that isn't a real custom domain — local
dev, and any `*.vercel.app` origin. `vercel.app` is on the Public Suffix List,
so browsers reject a cookie scoped to it. If it is ever set, it must carry the
**same value on both paired projects**, and the two must never diverge.

> `NEWSLETTER_FROM_ADDRESS` is `apps/web`-only — do **not** set it here.
> `TENANT_PROVISIONING_ADMIN_BASE_URL_OVERRIDE` is a local-dev escape hatch and
> must **never** be set on `platform-prod`.

> Every key above is **Production scope only**, same as the web projects — see
> the Preview-scope note under the web keys above.

#### OAuth callback URLs for the admin origin

`apps/platform` hosts sign-in too — its URL can be shared as a link or typed
directly, which is why it carries the full provider set rather than a
session-reader subset. The **GitHub and Google OAuth applications therefore
need the admin origin's callback URL added** alongside the existing web one:

- [ ] `https://admin.{your-hosting}/api/auth/callback/github`
- [ ] `https://admin.{your-hosting}/api/auth/callback/google`
- [ ] Same two for `https://admin-dev.{your-hosting}`.

Without these, OAuth from admin fails at the provider with a redirect-URI
mismatch — before it ever reaches our code, so nothing in this repo can
detect or report it.

### 4. GitHub Actions — environment-scoped variables & secrets

The deploy jobs run in the `development` / `production` **GitHub Environments**,
so set these per environment (Settings → Environments → `<env>`) — that's how each
job resolves its own project's id + token. The tenant lifecycle workflows
resolve their credentials the same way, from whichever Environment a dispatch
names, so their block below applies to **both** environments rather than only to
`production`.

**`development` environment**

- [ ] Variable `SANITY_STUDIO_PROJECT_ID` = `<DEV_PROJECT_ID>`
- [ ] Secret `SANITY_MIGRATE_TOKEN` = `<DEV_MIGRATE_TOKEN>` (Editor — the migrate job)
- [ ] Secret `DATABASE_URL_UNPOOLED` = `<DEV_DATABASE_URL_UNPOOLED>` (the `development`
      Neon branch's direct connection string — the `migrate-db` job's
      `drizzle-kit migrate`; same value as the Vercel env var above). **Confirm
      it actually points at the `development` branch** — see the Neon
      Postgres section above and #2057. **Not** read by any of the
      tenant lifecycle workflows, which read `TENANT_REGISTRY_DATABASE_URL`
      from the tenant-provisioning block below.
- [ ] Secret `VERCEL_TOKEN` = `<VERCEL_TOKEN>`
- [ ] Variable `VERCEL_ORG_ID` = `<VERCEL_ORG_ID>`
- [ ] Variable `VERCEL_PROJECT_ID_WEB` = `<VERCEL_PROJECT_ID>` (**web-dev**)
- [ ] Variable `VERCEL_PROJECT_ID_PLATFORM` = `<VERCEL_PROJECT_ID>` (**platform-dev**)
      — the `deploy-admin` job's target; until it's set that job no-ops green.
- [ ] Every entry in **"Tenant lifecycle — both environments"** below, with this
      environment's own values.

**`production` environment**

- [ ] Variable `SANITY_STUDIO_PROJECT_ID` = `<PRD_PROJECT_ID>`
- [ ] Secret `SANITY_MIGRATE_TOKEN` = `<PRD_MIGRATE_TOKEN>` (Editor — the migrate job)
- [ ] Secret `DATABASE_URL_UNPOOLED` = `<PRD_DATABASE_URL_UNPOOLED>` (the `main`
      Neon branch's direct connection string — the `migrate-db` job's
      `pg_dump` backup + `drizzle-kit migrate`; same value as the Vercel env
      var above). **Not** read by any of the tenant lifecycle workflows,
      which read `TENANT_REGISTRY_DATABASE_URL` from the block below,
      deliberately, so repointing the tenant registry at a different Neon
      branch can never silently repoint this deploy job too (#2056 — see the
      Neon Postgres section above for the incident that motivated it).
- [ ] Secret `VERCEL_TOKEN` = `<VERCEL_TOKEN>`
- [ ] Variable `VERCEL_ORG_ID` = `<VERCEL_ORG_ID>`
- [ ] Variable `VERCEL_PROJECT_ID_WEB` = `<VERCEL_PROJECT_ID>` (**web-prod**)
- [ ] Variable `VERCEL_PROJECT_ID_PLATFORM` = `<VERCEL_PROJECT_ID>` (**platform-prod**)
      — the `deploy-admin` job's target; until it's set that job no-ops green.
- [ ] Every entry in **"Tenant lifecycle — both environments"** below, with this
      environment's own values. Every scheduled `recheck-tenant-owners.yml`
      sweep resolves them from here.
- [ ] (Optional) require a reviewer on `production` for a manual gate before prod
      deploys run.

**Tenant lifecycle — both environments**

`.github/workflows/provision-tenant.yml`/`deprovision-tenant.yml`/
`invalidate-tenant-cache.yml` (`workflow_dispatch` only, the first triggered
from `apps/platform`'s "Add tenant" wizard) and
`.github/workflows/recheck-tenant-owners.yml`/`validate-tenant-documents.yml`
all bind to whichever
Environment their dispatch's `environment` input names (`development`/
`production`, default `production`) — every credential they need, including
the tenant registry connection string, resolves from that same Environment,
never a mix of the two.

So every entry below belongs on **both** the `development` and the
`production` Environment, each holding that environment's own values. A
fully-configured `production` does nothing for a `development` dispatch: it
fails on whatever `development` is missing. These workflows read
overlapping subsets, so configuring an environment for provisioning covers the
rest:

| Workflow                        | Reads                                                                                                                                                                |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provision-tenant.yml`          | all of them                                                                                                                                                          |
| `deprovision-tenant.yml`        | `SANITY_MANAGEMENT_TOKEN`, `VERCEL_TOKEN`, `VERCEL_TEAM_ID`, `VERCEL_PROJECT_ID_WEB`, `TENANT_REGISTRY_DATABASE_URL`, `WEB_APP_URL`, `SITE_CONFIG_REVALIDATE_SECRET` |
| `invalidate-tenant-cache.yml`   | `TENANT_REGISTRY_DATABASE_URL`, `WEB_APP_URL`, `SITE_CONFIG_REVALIDATE_SECRET` — the recovery path for `deprovision-tenant.yml`'s final step                         |
| `recheck-tenant-owners.yml`     | `SANITY_MANAGEMENT_TOKEN`, `TENANT_REGISTRY_DATABASE_URL`, and optionally `ADMIN_APP_BASE_URL` + `OPERATOR_ALERT_SECRET`                                             |
| `validate-tenant-documents.yml` | `TENANT_REGISTRY_DATABASE_URL`, `TENANT_TOKEN_ENCRYPTION_KEY`, and optionally `ADMIN_APP_BASE_URL` + `OPERATOR_ALERT_SECRET`                                         |

`recheck-tenant-owners.yml` also runs on a `schedule:`, and a scheduled run
carries no `inputs` context at all, so its binding is
`${{ inputs.environment || 'production' }}` rather than the bare input its
siblings use: every cron sweep targets `production`, and only a manual
dispatch can point it at `development`.

> **`TENANT_REGISTRY_DATABASE_URL` must be created as a Secret, not a
> Variable, in both environments.** GitHub Environments keep Secrets and
> Variables in separate namespaces — `secrets.NAME` and `vars.NAME` never see
> each other's values. All tenant lifecycle workflows read
> `secrets.TENANT_REGISTRY_DATABASE_URL` specifically; creating it as a
> Variable by mistake leaves the secret unset, and the job fails every
> dispatch with an empty `DATABASE_URL` rather than silently falling through
> to the wrong branch.

- [ ] Secret `TENANT_REGISTRY_DATABASE_URL` = that environment's own
      `DATABASE_URL_UNPOOLED` value (`<DEV_DATABASE_URL_UNPOOLED>` on
      `development`, `<PRD_DATABASE_URL_UNPOOLED>` on `production`), under a
      separate secret name — the workflows read it as `DATABASE_URL`.
      Deliberately a **different secret name** from `DATABASE_URL_UNPOOLED`,
      even though the value is identical within each environment, so
      retargeting the tenant registry can never silently retarget that
      environment's own deploy migration too.
- [ ] **Delete** the retired Secrets `TENANT_REGISTRY_DATABASE_URL_DEV` and
      `TENANT_REGISTRY_DATABASE_URL_PROD` from `production`.
      `recheck-tenant-owners.yml` was their only reader and now resolves each
      environment's own `TENANT_REGISTRY_DATABASE_URL` above, like its two
      siblings. Leaving them in place is harmless to any workflow but
      re-creates exactly the drift the split caused: several secrets holding
      the same connection string, only one of which anyone remembers to
      rotate.
- [ ] Secret `SANITY_MANAGEMENT_TOKEN` — an **organization-level** Sanity
      token with "create project" permission (broader than `SANITY_MIGRATE_TOKEN`,
      which is scoped to one already-existing project). Mint it at
      https://manage.sanity.io → your organization → API → Tokens. Used to
      create each new tenant's Sanity project/dataset/CORS entry, to mint its
      transient seed-content token and its persisted read-only token, and by
      the owner-elevation sweep to read and grant tenant project ACLs.
- [ ] Variable `SANITY_ORGANIZATION_ID` — the Sanity organization id every
      tenant project must be created under (find it at
      https://manage.sanity.io → your organization → Settings). Sent as
      `organizationId` in the Management API's `POST /projects` body;
      without it the project is silently created in whichever org the
      token's owner defaults to, not necessarily this one. Read by
      `provision-tenant.yml` only.
- [ ] Secret `TENANT_TOKEN_ENCRYPTION_KEY` — the **same** value already set as
      the Vercel env var of the same name on that environment's `apps/web`
      project (see the `@blog/db` env vars table above): `web-dev`'s on
      `development`, `web-prod`'s on `production`. `setTenantSanityToken`
      throws without it.
- [ ] Variable `ADMIN_APP_BASE_URL` — the deployed `apps/platform` origin for
      that environment (no trailing slash/path), e.g.
      `https://admin.{your-hosting}`. Used as the CORS origin step 1 adds to
      each new tenant's Sanity project, so it must match the domain on that
      environment's Vercel platform project exactly — `platform-dev` on
      `development`, `platform-prod` on `production` (§3 above). The two
      sweeps below (`recheck-tenant-owners.yml`,
      `validate-tenant-documents.yml`) reuse it as the base they POST
      operator alerts to; there is no second URL variable to set.
- [ ] Variable `TENANT_SANITY_DATASET` — the name of the single dataset created
      inside each new tenant's Sanity project, set to match the Environment it
      lives on. Externalized as a variable rather than hardcoded in TS;
      `provision-tenant.yml` also accepts a per-dispatch `tenantSanityDataset`
      input that overrides it for manual testing, which the wizard's real
      dispatches never set.
- [ ] Variable `WEB_APP_URL` — the deployed `apps/web` origin for that
      environment (no trailing slash), e.g. `https://{your-web-domain}`. Used
      to build the target URL for the revalidation webhook
      `provision-tenant.yml` creates on each new tenant's Sanity project. Also
      read by `deprovision-tenant.yml`/`invalidate-tenant-cache.yml`, as the
      origin either of them POSTs to when purging an archived (or still-active)
      tenant's cached pages.
- [ ] Secret `SANITY_REVALIDATE_SECRET` — the **same** value already set as
      that environment's `apps/web` `SANITY_REVALIDATE_SECRET` Vercel env var.
      Every tenant's webhook is created with this shared secret; a mismatch
      makes that tenant's webhook calls fail `apps/web`'s signature check, so
      content publishes in that tenant's Studio never trigger revalidation.
- [ ] Secret `SITE_CONFIG_REVALIDATE_SECRET` — the **same** value already set as
      that environment's `apps/web` and `apps/platform` Vercel env vars (§3
      above, in both projects' tables). A GitHub Environment Secret is a **separate store** from those
      Vercel project vars, so setting it there does not cover this; all three
      copies must be byte-identical. `deprovision-tenant.yml`'s final step
      (and `invalidate-tenant-cache.yml`, its retry path) sends it as a
      bearer token to purge a tenant's cached pages, and — unlike every
      other credential in this list — throws rather than skipping when it is
      absent, so a run fails loudly instead of leaving the site serving from
      cache.
- [ ] (Optional) Secret `OPERATOR_ALERT_SECRET` — paired with
      `ADMIN_APP_BASE_URL` above, this is what lets
      `recheck-tenant-owners.yml` and `validate-tenant-documents.yml` report
      an operator alert. Neither workflow sends email itself: each POSTs the
      bare facts (tenant id, outcome or invalid-document count) to
      `apps/platform`'s `/api/internal/operator-alert`, and that app resolves
      the superadmin recipients and sends. It is the bearer token that
      route authenticates against, so **this copy and the one in the
      `platform-dev`/`platform-prod` Vercel projects must be byte-identical**
      — set both, or the route answers 401 and no alert is delivered. Leave
      either unset and the sweep skips only the notification and still runs
      to completion, so a half-configured pair looks healthy while alerting
      silently does nothing.
- [ ] Variable `VERCEL_TEAM_ID` — only needed if the Vercel account is
      team-owned; omit otherwise.
- [ ] `VERCEL_TOKEN` / `VERCEL_PROJECT_ID_WEB` from that environment's
      checklist above are reused as-is — no separate copies to create.
      `VERCEL_PROJECT_ID_WEB` here means the **shared web** project
      (`web-dev` / `web-prod`) — the one the "Map domain" step adds every
      tenant's custom domain to, never a per-tenant project.

**`apps/platform`'s own Vercel project (not a GitHub Environment)**

The "Add tenant" wizard's and the tenant status page's "Deprovision tenant"
control's Server Actions dispatch `provision-tenant.yml`/`deprovision-tenant.yml`
directly against the GitHub API from `apps/platform` itself, not from a CI job
— so these are Vercel env vars on that app's project, not entries on a GitHub
Environment. See `docs/context/environment-variables.md`.

- [ ] Env var `TENANT_PROVISIONING_GITHUB_REPO` = `<owner>/<repo>` (e.g.
      `ValOvinnikov/blog`), paired with its own
      `TENANT_PROVISIONING_GITHUB_TOKEN` — there's no `GITHUB_REPOSITORY`-style
      var to infer the repo from outside Actions.
- [ ] Optional env var `TENANT_PROVISIONING_DATASET` (`development` or
      `production`) picks which dataset that deployment's provisioning runs
      create in — a manually-set, per-deployment opt-in, same posture as
      `apps/web`'s `WEB_ANALYTICS_ENABLED`, since `VERCEL_ENV` can't reliably
      tell a dev deployment apart from real production. Left unset,
      provisioning falls back to the dispatched GitHub Environment's
      `TENANT_SANITY_DATASET`. The same value is also forwarded as both
      workflows' `environment` input — a `platform-dev` deployment setting
      this to `development` points its provisioning/deprovisioning dispatches
      at the `development` tenant registry too, not just the Sanity dataset.

> Repo-level `SANITY_STUDIO_PROJECT_ID` / `SANITY_STUDIO_DATASET` remain the
> fallback for `ci.yml` (which sets no environment) — point them at whichever
> project CI's typegen/migration checks should target.

- [ ] Repo-level secret `SANITY_API_READ_TOKEN` (Settings → Secrets and
      variables → Actions → New repository secret) — a **Viewer** token
      minted in whichever project the repo-level `SANITY_STUDIO_PROJECT_ID`
      above points at. Backs `ci.yml`'s Migrations job (both the dry-run
      step and the separate advisory `document-validation` job) — until
      it's set, both steps stay guarded (`if: env.SANITY_READ_TOKEN != ''`)
      and no-op green rather than fail.

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

**Repo level — production-target guard for `migrate-db` (both directions)**

Both `deploy-development.yml`'s and `deploy-production.yml`'s `migrate-db`
jobs run unreviewed against a live database — dev on every merge to `main`
with no approval gate, prod behind the `production` Environment's required
reviewer but with no independent check that the secret actually points where
the tag says it should. A `development`-environment secret accidentally left
pointing at the production Neon branch would migrate production with no
backup; a `production`-environment secret accidentally left pointing at
_anything else_ would silently skip migrating production while reporting
success (#2264). Neither job can read the other's `DATABASE_URL_UNPOOLED`
directly to compare (GitHub Environments isolate secrets per environment), so
the production host is mirrored into one plain repo Variable instead — not a
Secret, since a hostname alone can't authenticate anything — and **both**
jobs' guard steps read that same repo-level Variable.

- [ ] Variable `PRODUCTION_DB_HOST` = **the bare hostname only** (e.g.
      `ep-xxxx.us-east-2.aws.neon.tech`), set **once, at repo level**
      (Settings → Secrets and variables → Actions → Variables tab, not under
      either Environment) — no `postgresql://` scheme, credentials, port,
      path, or query string. It must be the hostname portion of the
      **production** Neon branch's own **`DATABASE_URL_UNPOOLED`** value
      specifically (the direct connection string — the part between `@` and
      `:5432/...`), **not** the pooled `DATABASE_URL`. Both guard steps only
      ever parse `DATABASE_URL_UNPOOLED` — a pooled-connection host (Neon
      suffixes it `-pooler`) never matches, so pasting the wrong one leaves
      the guard unable to catch a real mis-set target. An environment-scoped
      Variable of the same name on either Environment would **shadow** this
      repo-level one for jobs scoped to that Environment — don't create one;
      if either Environment already has one, delete it so both jobs
      genuinely read the same value.

Each guard step **fails its job** if this Variable is unset, or if its value
doesn't look like a bare hostname (a scheme, `@`, `:`, or `/` trips a loud,
explicit error) — neither silently no-ops. The two directions are inverted:
dev fails when its resolved host **matches** `PRODUCTION_DB_HOST` (it should
never be touching production); prod fails when its resolved host
**differs from** `PRODUCTION_DB_HOST` (a release must always touch
production, and only production). Set the Variable correctly before either
job first runs with a real `DATABASE_URL_UNPOOLED`, or every deploy touching
`@blog/db` — dev on merge, prod on tag — will fail at this step.

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
- [ ] `http://localhost:3001` — credentials **on** (the Studio mounted in a
      locally-running `apps/platform`).
- [ ] `https://admin-dev.{your-hosting}` — credentials **on** (the dev admin
      panel, which mounts the Studio).
- [ ] `https://admin.{your-hosting}` — credentials **on** (the prod admin panel).
- [ ] `https://<DEV_WEB_URL>` — credentials **off** (token reads).
- [ ] `https://<PRD_WEB_URL>` — credentials **off**.
- [ ] Remove the old `https://valovinnikov-blog-dev.sanity.studio` /
      `https://valovinnikov-blog.sanity.studio` origins (see "Decommissioning
      the old `*.sanity.studio` Studio" below).

> The Studio is served from the admin panel's own origin, so its CORS origin is
> the admin panel's — there is no separate Studio hostname to allow. Per-tenant
> Sanity projects get this same origin registered automatically by
> `provision-tenant`; the two rows above are for the dev/prod projects, which
> predate provisioning and are set by hand.

### 6a. Decommissioning the old `*.sanity.studio` Studio

Once the Studio mounted in the admin panel is live and verified (it loads,
signs in, and can read/write the correct dataset):

- [ ] From `packages/studio`, with each project's env pointed at it (`SANITY_STUDIO_HOSTNAME`
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

- [ ] `packages/studio/.env` (gitignored): `SANITY_STUDIO_PROJECT_ID=<DEV_PROJECT_ID>`,
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

> **Temporarily suspended (2026-09-04).** Automatic deployments are off as a
> Vercel cost freeze: `deploy-development.yml`'s `push` trigger is commented
> out and both Storybook projects carry `git.deploymentEnabled: false`. Dev
> deploys run via `gh workflow run deploy-development.yml`; Storybook deploys
> from the Vercel dashboard's **Redeploy** button. The rest of this section
> describes the steady state, which resumes when #2648 lands. Details in
> [`docs/context/ci-automation.md`](context/ci-automation.md)'s "Deployments
> are temporarily manual".

### Development — on merge to `main`

`.github/workflows/deploy-development.yml` (Vercel's `main` auto-deploy is
disabled on both deployed projects, so this is the **only** path onto dev —
nothing deploys before checks pass):

1. **`changes` gate** runs `turbo-ignore` per target (`@blog/studio`, `web`,
   `platform`) — a downstream job only runs when the merge affects its
   target's turbo graph (a no-op merge skips everything, including `verify`;
   a manual `workflow_dispatch` bypasses the gate on every job, so all of them
   run). `@blog/studio` gates the Sanity `migrate` job rather than a deploy —
   the Studio ships as a package and is not deployed on its own. "Affects" is
   measured from the last commit this workflow **completed successfully
   against**, not from `HEAD^1`, so a merge whose run was cancelled by the next
   merge is still covered by that next run — see "A cancelled dev deploy is not
   a lost deploy" in
   [`docs/context/ci-automation.md`](context/ci-automation.md).
2. **`verify` gate** re-runs `type-check` / `lint` / `test` / `build` on the
   merged commit.
3. **`migrate`** (`environment: development`) applies any un-applied migrations
   to the **development** dataset via `migrate:deploy` (a no-op when none are
   pending), so dev's data never lags its code — the #355 failure mode. It is
   gated on `studio`-or-`web` — the union of the jobs that depend on it, narrower
   than `verify`'s condition, so an admin-only merge doesn't run a Sanity
   migration for an app that never touches Sanity, while still never being
   skipped out from under a deploy that needs it. `deploy-web` `needs: [changes, verify,
migrate, migrate-db]` (see step 4 below for `migrate-db`). No
   artifact backup here — dev is the disposable staging line (see "Refreshing
   development from production"
   below for the manual post-migration refresh); the job is guarded on
   `SANITY_MIGRATE_TOKEN`, so it's inert until that secret exists. **No
   approval gate on dev** (unlike prod) — dev auto-migrates.
4. **`migrate-db`** (`environment: development`) — the same idea as `migrate`
   above, for the separate `@blog/db` (Drizzle/Neon) relational store: applies
   any un-applied schema migrations to the **development** Neon branch via
   `pnpm --filter @blog/db db:migrate` (`drizzle-kit migrate`, a no-op when
   none are pending). Gated on `web`-or-`admin` (the Studio never touches
   Postgres, so a studio-only change doesn't trigger it); `deploy-web` and
   `deploy-admin` `need` it. No artifact backup here,
   same disposable-staging-line stance as `migrate`; guarded on
   `DATABASE_URL_UNPOOLED`, so it's inert until that secret exists. Before
   applying, a guard step compares the resolved connection host against the
   repo Variable `PRODUCTION_DB_HOST` and fails the job loudly if they match
   — see "Repo level — production-target guard for `migrate-db` (both
   directions)" above; the guard step itself fails the job (not silently
   skips) if that Variable is unset or malformed. **No approval gate on
   dev.** See
   `.claude/agents/db.md`'s "Migrations" section.
5. **`deploy-web`** → `web-dev` via the Vercel CLI
   (`vercel pull → build --prod → deploy --prebuilt --prod`).
6. **`deploy-admin`** → `platform-dev` via the Vercel CLI, same mechanism.
   `needs: [changes, verify, migrate-db]` — it depends on `@blog/db` (it
   writes `site_config`), so it is at least as exposed to schema drift as the
   public site is, but not on `migrate`, since it never reads Sanity.

Concurrency is scoped **per job**, not workflow-wide. `changes` / `verify` /
`deploy-*` each keep `cancel-in-progress: true`, so a newer merge still
supersedes an in-flight build/deploy — "latest merge wins" still holds. (The
supersede is slightly lazier than the old workflow-level cancel: a per-job
group cancels an older run's `deploy-web`/`deploy-admin` only once the newer
run's _same_ job is ready to start — i.e. after the newer run clears its own
`changes` → `verify` → `migrate`/`migrate-db` chain — so an old deploy can
finish before being superseded rather than being cut off the instant a new
run starts.) `migrate` and `migrate-db` are the exception — both groups use
`cancel-in-progress: false` (#409), so a newer merge **queues behind** a
running migration instead of interrupting a mutation mid-transaction. GitHub
keeps at most one pending run per group, so a burst of merges collapses to
"finish the current migration, then run the latest".

There are **no PR preview deployments** — deploys happen only on merge to
`main`, and while the cost freeze above is in force, only on a manual
`workflow_dispatch`.

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
   no second approval mechanism. Before backing up or migrating, a guard step
   compares the resolved connection host against the repo Variable
   `PRODUCTION_DB_HOST` and fails the job loudly if they **differ** — the
   inverse of the dev guard, which fails on a match — see "Repo level —
   production-target guard for `migrate-db` (both directions)" above; the
   guard step itself fails the job (not silently skips) if that Variable is
   unset or malformed. Every step is guarded on `DATABASE_URL_UNPOOLED`, so
   the job is a **no-op until that secret is configured** — safe to ship
   ahead of setup. `deploy-web` and `deploy-admin` `need` it (the Studio never
   touches Postgres). See `.claude/agents/db.md`'s "Migrations" section.
4. **`deploy-web`** → `web-prod` via the Vercel CLI
   (`vercel pull → build --prod → deploy --prebuilt --prod`).
5. **`deploy-admin`** → `platform-prod` via the Vercel CLI, same mechanism. A tag
   is a deliberate full release, so both apps deploy — there is no change
   detection on the production side.

`deploy-web` `needs: [verify,
migrate, migrate-db]`; `deploy-admin` `needs: [verify, migrate-db]` — so **new
code is never served before pending migrations run**; a failed or
reviewer-rejected `migrate`/`migrate-db` skips the deploy(s) that depend on
it, leaving the old code serving the old (un-migrated) data.

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
   `packages/studio/scripts/refresh-dev-dataset-lib.mjs`'s safety guard, so a
   misconfigured environment fails loudly rather than silently reversing.

See `packages/studio/migrations/README.md` for the underlying script details.

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
- [ ] A merge to `main` runs `Deploy Development` → `verify` passes → the
      affected app(s) among web / admin deploy (no deploy runs before `verify`
      is green, and no PR deploys either of them).
- [ ] Publishing in the Studio updates the corresponding site within seconds
      (webhook). Dev publishes hit the dev site; prod publishes hit prod.
- [ ] **Sign in on the admin domain, then again on the main site.** A green
      deploy proves none of the auth wiring — `AUTH_SECRET`, the provider
      credentials, and the OAuth callback registrations all fail only at
      runtime, and the first of those fails silently. Each origin must be
      signed into on its own: with `AUTH_COOKIE_DOMAIN` deliberately unset
      (see above), a session does **not** carry from one to the other, so a
      second sign-in being required is the expected result, not a fault.

---

## Storybook — hosted `@blog/ui` design system (optional, not a deploy environment)

Unlike everything above, this is **not** part of the dev/prod pipeline — no
Sanity project, no dataset, no CI-gated migration. It's a single Vercel
project hosting `@blog/ui`'s Storybook build for visual PR review, and it
deliberately uses Vercel's Git integration with PR previews **enabled** —
the opposite of `web-dev`/`web-prod`/`platform-dev`/`platform-prod`, whose Git
integration is disabled in favor of a CI-gated deploy. That's intentional:
`@blog/ui` is pure and prop-driven (no `service`/Sanity import), so there's
no content or credentials a pre-merge preview could leak — and the entire
point of hosting Storybook is letting a reviewer see a component change
_before_ it merges, which a post-merge-only deploy would defeat. See
`docs/superpowers/specs/2026-08-02-storybook-vercel-hosting-design.md` (#339)
for the full design discussion.

Build/output/skip-when-unaffected config is in code
(`packages/ui/vercel.json`), same philosophy as `apps/web`/`apps/platform`'s
`vercel.json`; only project creation, domain, and confirming Git
integration stays **on** are human-gated console steps:

- [ ] Vercel → Add New → Project → import `{github_account}/blog`; **Root
      Directory `packages/ui`** + tick _"Include files outside of the root
      directory"_; **Node.js 24.x**; Framework Preset **Other** (build/output
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
primary `web-dev`/`web-prod` project (`git.deploymentEnabled:
false`, keeping its Git auto-deploy off in favor of the CI-gated pipeline),
and Vercel reads one `vercel.json` per Root Directory regardless of which
project is asking — a second project also rooted at `apps/web` would inherit
that same `deploymentEnabled: false` and silently never deploy. Config
instead lives in a **repo-root `vercel.json`** (a new file, distinct from
every package's own), with the Root Directory set to the repo root itself.

Because the Root Directory is the repo root but Storybook builds into
`apps/web/storybook-static` (one level down), the root `vercel.json`'s
`buildCommand` copies that result up to a repo-root `storybook-static` and
sets `outputDirectory` to `storybook-static` — so the output basename sits at
the Root Directory, exactly as `packages/ui`'s does. Don't "simplify" the copy
away or point `outputDirectory` back at the nested `apps/web/storybook-static`:
the deploy then fails with `No Output Directory named "storybook-static" found`
whenever the project's dashboard default/framework preset resolves output at
the Root Directory rather than honoring the nested path.

**Troubleshooting:** if the deploy instead fails with
`cp: cannot stat 'apps/web/storybook-static'`, the project's Root Directory is
wrong — it's set to `apps/web` rather than the repo root, so the
`buildCommand` runs from `apps/web` and its `cp` looks for
`apps/web/apps/web/storybook-static`. Set the Root Directory back to the repo
root (`.`). (A Root Directory of `apps/web` also makes the project read
`apps/web/vercel.json`, whose `git.deploymentEnabled: false` belongs to the
main web app — a second reason not to root it there.)

- [ ] Vercel → Add New → Project → import `{github_account}/blog`; **Root
      Directory** left at the repo root (`.`) — do **not** set it to
      `apps/web`; **Node.js 24.x**; Framework Preset **Other** (build/output
      commands come from the root `vercel.json`).
- [ ] Confirm Git integration is **enabled**, with PR previews **on** — same
      as the `packages/ui` project above.
- [ ] **Per-project PR status check:** on a PR that triggers this project's
      build, a `Vercel – <project-name>` check should appear reflecting the
      deploy's pass/fail — the `packages/ui` project (set up above) already
      posts one, and this project should too, else a broken Storybook build
      here is invisible on the PR and shows only in the Vercel dashboard. If
      it's missing, re-check that this project's Git integration + PR previews
      (the toggle above) are **on** and that the Vercel GitHub app is
      authorized to post commit statuses for it, matching the `packages/ui`
      project. Do **not** make this check **required** on `main` branch
      protection — Storybook previews can hit the account-level build rate
      limit (below), and a required check would let that infra failure block
      merges.
- [ ] Settings → Domains → add `web-storybook.{your_hosting}` (production
      deployment only); add the DNS record at whatever registrar/DNS host
      manages `{your_hosting}`.
- [ ] No CORS, no tokens — this project never talks to Sanity's API at
      request time, so it needs none of the read-token/CORS-origin dance the
      rest of this doc walks through.
- [ ] **`NEXT_PUBLIC_SANITY_PROJECT_ID` / `NEXT_PUBLIC_SANITY_DATASET`** (dev
      project's values) **are** set as env vars on this project — the one
      deliberate exception to "no env vars" above. `SanityImage` (wrapping the
      `sanity-image` package) needs a real CDN base URL to render an actual
      image in the hero/portable-text stories rather than a broken one; both
      values are public (`NEXT_PUBLIC_*`, no secret token involved) and only
      resolve a dedicated placeholder asset uploaded to the dev dataset for
      this purpose (unreferenced by any real content). Added 2026-08-21 (#1779).

### Deploy-skip behaviour and the Vercel build rate limit

Both Storybook projects share `scripts/vercel-ignore-affected.sh` as their
`ignoreCommand`. A PR push builds a project only when turbo sees its package
as **affected**, or when one of its watched deploy-config paths changed (its
own `vercel.json`, or the shared ignore script). Everything else skips, so an
unrelated PR triggers neither deployment and consumes no build quota. A change
touching only `packages/config/src/types/**` or
`packages/config/src/sanity/generated/**` also skips — turbo marks every
dependent affected by any `packages/config` change, but a bare
`storybook build` transpiles without type-checking, so type-only files can't
reach the output.

The commit that diff is taken against is `VERCEL_GIT_PREVIOUS_SHA` when Vercel
supplies one, else the merge-base with `main`, else `HEAD^1`.

**That last fallback is load-bearing on `main`, and its absence once bricked a
project.** On a `main` build the merge-base with `main` is `HEAD` itself, and a
commit diffed against itself shows nothing affected — so every `main` build
skipped. No build meant no successful deployment, which meant
`VERCEL_GIT_PREVIOUS_SHA` stayed empty, which meant the next merge did the same
thing. `web-ui-library` sat in that deadlock showing "No Production Deployment"
until the `HEAD^1` fallback was added.

If a Storybook project ever shows "No Production Deployment" again, note that
the code fix cannot bootstrap it: the project needs **one** successful
production deployment before `VERCEL_GIT_PREVIOUS_SHA` has anything to hold.
Promote an existing successful preview deployment to production in the
dashboard — a console action, like everything else in this doc.

Because `apps/web` and `apps/platform`'s primary projects both set
`git.deploymentEnabled: false` (CI-gated pipeline), these two Storybook
projects are the **only** ones that preview-deploy on a PR. Deploy volume is
therefore already minimal — each builds only when genuinely affected. When a
run still reports `Deployment rate limited — retry in 24 hours` (as on #1684),
that is Vercel's **account-level** build rate limit refusing the deployment
at creation, _before_ the ignore step runs — not a skip-logic bug and not
specific to the PR that surfaced it. Those checks aren't required, so the
failure is cosmetic. The levers are the Vercel plan (removing the per-window
limit) or accepting the occasional non-blocking noise; there is no
`ignoreCommand` env var exposing PR draft state, so gating previews to
non-draft PRs isn't achievable from the ignore command alone.
