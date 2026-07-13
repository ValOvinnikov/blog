# Deploy & release runbook

How this blog deploys, and the one-time setup that makes the pipeline live.

- **Local dev + every `main` merge** → **development** environment
  (`development` dataset).
- **Push a `vX.Y.Z` git tag** → **production** environment (`production`
  dataset).

Both the Sanity **Studio** and the Next.js **web app** deploy on each trigger.
Architecture rationale lives in `SPEC.md` §13 and
`docs/superpowers/specs/2026-07-13-multi-env-release-pipeline-design.md`.

---

## Environment matrix

| Concern              | Development                           | Production                        |
| -------------------- | ------------------------------------- | --------------------------------- |
| Sanity dataset       | `development`                         | `production`                      |
| Studio hostname      | `valovinnikov-blog-dev.sanity.studio` | `valovinnikov-blog.sanity.studio` |
| Vercel project       | `blog-dev`                            | `blog-prod`                       |
| Web URL (initial)    | `blog-dev.vercel.app`                 | `blog.vercel.app`                 |
| Deploy trigger       | push/merge to `main`                  | push git tag `v*`                 |
| Web deploy           | Vercel native Git integration         | Vercel CLI (GitHub Actions)       |
| Studio deploy        | GitHub Actions                        | GitHub Actions                    |
| Revalidation webhook | dev → dev site                        | prod → prod site                  |

> Custom domains are deferred (#275); `*.vercel.app` URLs until then.

---

## Values scratchpad

Fill these as you go — later steps reuse them.

```
PROJECT_ID            = ____________   (Sanity → API → Project ID; public)
READ_TOKEN            = ____________   (Sanity Viewer token; secret)
DEPLOY_TOKEN          = ____________   (Sanity Deploy/write token; secret)
DEV_REVALIDATE_SECRET = ____________   (openssl rand -hex 32; secret)
PRD_REVALIDATE_SECRET = ____________   (openssl rand -hex 32; secret)
VERCEL_TOKEN          = ____________   (Vercel account token; secret)
VERCEL_ORG_ID         = ____________   (from `vercel link` on blog-prod)
VERCEL_PROJECT_ID     = ____________   (from `vercel link` on blog-prod; blog-prod)
```

---

## One-time setup (human-gated console work)

The workflows are written to **no-op green until their secrets exist**, so the
code can merge first; the pipeline activates once the steps below are done.

### 1. Sanity — datasets & tokens · https://manage.sanity.io

- [ ] **Datasets:** confirm `production` exists; **create `development`**
      (visibility public is fine — mirrors production).
- [ ] **API → Project ID:** copy → `PROJECT_ID`.
- [ ] **API → Tokens → Add API token:**
  - [ ] `web-read` — permission **Viewer** → `READ_TOKEN`.
  - [ ] `ci-deploy` — permission **Deploy Studio** (write) → `DEPLOY_TOKEN`.
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

- [ ] **`blog-dev`**
  - [ ] Settings → Git → **Production Branch = `main`** (auto-deploys `main`,
        serves PR previews).
  - [ ] Ignored Build Step → `npx turbo-ignore web`.
- [ ] **`blog-prod`**
  - [ ] Settings → Git → **Ignored Build Step → `exit 0`** (always skip — Git
        never deploys prod; only the tag workflow does).
  - [ ] From repo root: `npx vercel link` → select `blog-prod`. Read the ids
        from `.vercel/project.json` → `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
        (Then delete the local `.vercel/` dir — it's gitignored scratch.)

#### Vercel env vars — set on **each** project (Production + Preview scopes)

Same five keys per project; only the dataset / URL / secret differ:

| Key                             | `blog-dev` value              | `blog-prod` value         |
| ------------------------------- | ----------------------------- | ------------------------- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | `<PROJECT_ID>`                | `<PROJECT_ID>`            |
| `NEXT_PUBLIC_SANITY_DATASET`    | `development`                 | `production`              |
| `NEXT_PUBLIC_SITE_URL`          | `https://blog-dev.vercel.app` | `https://blog.vercel.app` |
| `SANITY_API_READ_TOKEN`         | `<READ_TOKEN>`                | `<READ_TOKEN>`            |
| `SANITY_REVALIDATE_SECRET`      | `<DEV_REVALIDATE_SECRET>`     | `<PRD_REVALIDATE_SECRET>` |

> `SANITY_API_READ_TOKEN` is server-only (never exposed to the browser). One
> project-scoped Viewer token reads both datasets, so the same value is fine.

### 4. GitHub Actions — repo secrets & variables

Settings → Secrets and variables → Actions.

- [ ] **Variable** `SANITY_STUDIO_PROJECT_ID` = `<PROJECT_ID>` (public id → a
      Variable, not a Secret; the CI/typegen jobs already read it).
- [ ] **Secret** `SANITY_DEPLOY_TOKEN` = `<DEPLOY_TOKEN>`.
- [ ] **Secret** `VERCEL_TOKEN` = `<VERCEL_TOKEN>`.
- [ ] **Secret** `VERCEL_ORG_ID` = `<VERCEL_ORG_ID>`.
- [ ] **Secret** `VERCEL_PROJECT_ID` = `<VERCEL_PROJECT_ID>` (blog-prod).
- [ ] (Optional) GitHub **Environments** `development` / `production` — add a
      required reviewer on `production` for an extra manual gate before prod
      deploys run.

### 5. Sanity — revalidation webhooks · API → Webhooks → Create webhook

Create **two** (the route `/api/revalidate` already exists):

| Field       | dev webhook                                  | prod webhook                             |
| ----------- | -------------------------------------------- | ---------------------------------------- |
| Name        | `revalidate dev`                             | `revalidate prod`                        |
| URL         | `https://blog-dev.vercel.app/api/revalidate` | `https://blog.vercel.app/api/revalidate` |
| Dataset     | `development`                                | `production`                             |
| Trigger     | Create · Update · Delete                     | Create · Update · Delete                 |
| HTTP method | `POST`                                       | `POST`                                   |
| API version | `v2021-03-25` (or later)                     | `v2021-03-25` (or later)                 |
| Projection  | `{_type, _id, "slug": slug.current}`         | `{_type, _id, "slug": slug.current}`     |
| Secret      | `<DEV_REVALIDATE_SECRET>`                    | `<PRD_REVALIDATE_SECRET>`                |

### 6. Sanity — CORS origins · API → CORS origins

- [ ] `http://localhost:3333` — credentials **on** (local Studio).
- [ ] `https://valovinnikov-blog-dev.sanity.studio` — credentials **on**.
- [ ] `https://valovinnikov-blog.sanity.studio` — credentials **on**.
- [ ] `https://blog-dev.vercel.app` — credentials **off** (token reads).
- [ ] `https://blog.vercel.app` — credentials **off**.

### 7. Local dev configuration

- [ ] `apps/cms/.env` (gitignored): `SANITY_STUDIO_PROJECT_ID=<PROJECT_ID>`,
      `SANITY_STUDIO_DATASET=development`.
- [ ] `apps/web/.env.local` (gitignored): `NEXT_PUBLIC_SANITY_PROJECT_ID`,
      `NEXT_PUBLIC_SANITY_DATASET=development`, and optionally
      `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.
- [ ] (Optional) seed `development` from production:
      `pnpm --filter cms dataset:export` then import into `development`, or
      author fresh dev content. `development` is empty until seeded.

---

## How a deploy happens (steady state)

### Development — on merge to `main`

1. **Web:** `blog-dev`'s Vercel Git integration auto-builds `main` against the
   `development` dataset. PRs get preview deployments automatically.
2. **Studio:** `.github/workflows/deploy-development.yml` runs (when `apps/cms/**`
   or `packages/config/**` changed) and deploys
   `valovinnikov-blog-dev.sanity.studio`.

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
- [ ] Opening a PR triggers a `blog-dev` **Preview** build; a docs-only push is
      skipped by `turbo-ignore`.
- [ ] Publishing in the Studio updates the corresponding site within seconds
      (webhook). Dev publishes hit the dev site; prod publishes hit prod.
