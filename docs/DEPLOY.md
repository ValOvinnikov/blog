# Deploy & release runbook

How this blog deploys, and the one-time setup that makes the pipeline live.

- **Local dev + every `main` merge** → **development** environment
  (`development` dataset).
- **Push a `vX.Y.Z` git tag** → **production** environment (`production`
  dataset).

Both the Sanity **Studio** and the Next.js **web app** deploy on each trigger.
Architecture rationale lives in `SPEC.md` §13 and
`docs/superpowers/specs/2026-07-13-multi-env-release-pipeline-design.md`.

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
deploys before checks pass):

- [ ] **`blog-dev`**
  - [ ] Settings → Git → **Ignored Build Step → `exit 0`** (skip all Git-triggered
        builds — no auto-deploy, no PR previews; the `Deploy Development` workflow
        deploys it via the CLI on merge to `main`, after its `verify` gate).
  - [ ] From repo root: `npx vercel link` → select `blog-dev`. Read the ids from
        `.vercel/project.json` → `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
        (Then delete the local `.vercel/` dir — it's gitignored scratch.)
- [ ] **`blog-prod`**
  - [ ] Settings → Git → **Ignored Build Step → `exit 0`** (always skip — Git
        never deploys prod; only the tag workflow does).
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
- [ ] Secret `VERCEL_TOKEN` = `<VERCEL_TOKEN>`
- [ ] Secret `VERCEL_ORG_ID` = `<VERCEL_ORG_ID>`
- [ ] Secret `VERCEL_PROJECT_ID` = `<VERCEL_PROJECT_ID>` (**blog-dev**)

**`production` environment**

- [ ] Variable `SANITY_STUDIO_PROJECT_ID` = `<PRD_PROJECT_ID>`
- [ ] Secret `SANITY_DEPLOY_TOKEN` = `<PRD_DEPLOY_TOKEN>`
- [ ] Secret `VERCEL_TOKEN` = `<VERCEL_TOKEN>`
- [ ] Secret `VERCEL_ORG_ID` = `<VERCEL_ORG_ID>`
- [ ] Secret `VERCEL_PROJECT_ID` = `<VERCEL_PROJECT_ID>` (**blog-prod**)
- [ ] (Optional) require a reviewer on `production` for a manual gate before prod
      deploys run.

> Repo-level `SANITY_STUDIO_PROJECT_ID` / `SANITY_STUDIO_DATASET` remain the
> fallback for `ci.yml` (which sets no environment) — point them at whichever
> project CI's typegen/migration checks should target.

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

1. **`verify` gate** re-runs `type-check` / `lint` / `test` / `build` on the
   merged commit. Both deploy jobs `needs: verify`.
2. **`deploy-studio`** → `valovinnikov-blog-dev.sanity.studio` (development
   dataset).
3. **`deploy-web`** → `blog-dev` via the Vercel CLI
   (`vercel pull → build --prod → deploy --prebuilt --prod`).

There are **no PR preview deployments** — deploys happen only on merge to `main`.

### Production — on a `vX.Y.Z` tag

`.github/workflows/deploy-production.yml`:

1. **`verify` gate** re-runs `type-check` / `lint` / `test` / `build` on the
   tagged commit. Both deploy jobs `needs: verify`, so a red commit can never be
   promoted — even if you tag the wrong SHA.
2. **`deploy-studio`** → `valovinnikov-blog.sanity.studio` (production dataset).
3. **`deploy-web`** → `blog-prod` via the Vercel CLI
   (`vercel pull → build --prod → deploy --prebuilt --prod`).

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
