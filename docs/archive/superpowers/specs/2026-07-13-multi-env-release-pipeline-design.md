# Multi-environment release pipeline — design

> **Archived — implemented.** See SPEC.md §13. Deployment topology for current behavior.

**Date:** 2026-07-13
**Status:** Draft (awaiting review)
**Scope:** Deployment/CI infrastructure for `apps/cms` (Studio) and `apps/web`
(Next.js site) across two environments, driven by branch merges and git tags.

## 1. Goal

Two long-lived environments with automated, trigger-based deploys:

- **Development** — always reflects `main`. Every merge to `main` deploys the
  Studio + web app against the `development` dataset. This is also the dataset
  used for local development.
- **Production** — cut deliberately by pushing a `vX.Y.Z` git tag. The tagged
  commit's Studio + web app deploy against the `production` dataset.

Both Studio **and** web deploy on each trigger. The git **tag is the sole source
of truth** for the version; `package.json` version is not synced.

## 2. Environment matrix

| Concern                 | Development                           | Production                        |
| ----------------------- | ------------------------------------- | --------------------------------- |
| Sanity dataset          | `development`                         | `production`                      |
| Studio hostname         | `valovinnikov-blog-dev.sanity.studio` | `valovinnikov-blog.sanity.studio` |
| Vercel project          | `blog-dev`                            | `blog-prod`                       |
| Web URL (initial)       | `blog-dev.vercel.app`                 | `blog.vercel.app`                 |
| Deploy trigger          | push/merge to `main`                  | push tag `v*`                     |
| Web deploy mechanism    | Vercel native Git integration         | Vercel CLI in GitHub Actions      |
| Studio deploy mechanism | GitHub Actions (`sanity deploy`)      | GitHub Actions (`sanity deploy`)  |
| Revalidation webhook    | dev webhook → dev site                | prod webhook → prod site          |

Custom domains are deferred to #275; `*.vercel.app` URLs are used until then.

## 3. Versioning & release model

`main` is a continuous **staging line**; tags are **promotions** of a specific
`main` commit to production.

- Version format: **`vMAJOR.MINOR.PATCH`** (SemVer), starting at `v0.1.0`.
  - PATCH — fixes/copy tweaks. MINOR — new features/sections. MAJOR — big
    milestone / breaking redesign. `1.0.0` = "officially launched."
  - Pre-1.0 (`0.y.z`): bump MINOR freely for notable changes, PATCH for fixes.
- Versions cover **application code only**, never content. Content changes flow
  Studio → revalidation webhook, independent of releases.
- Release management is **manual** to start (a human runs `git tag` + push).
  Graduating to automated tagging (release-please / changesets over the existing
  Conventional Commits) is possible later without changing the pipeline.

**Cut a release:**

```sh
git checkout main && git pull
git tag v0.1.0
git push origin v0.1.0     # ← triggers the production deploy
```

## 4. Pipelines

### 4a. Pull request → preview

Vercel's native Git integration on `blog-dev` builds a **preview deployment** for
every PR (unchanged from today). `turbo-ignore` skips builds unaffected by the
diff. Existing `ci.yml` (type-check/lint/test/build/migration dry-run) is
unchanged and remains the merge gate.

### 4b. Merge to `main` → development

- **Web:** `blog-dev`'s Vercel Git integration auto-deploys `main` (its "Production
  Branch" in Vercel's sense = `main`), configured against the `development`
  dataset. No CLI needed. `turbo-ignore` skips web-irrelevant merges.
- **Studio:** a new workflow `.github/workflows/deploy-development.yml` runs on
  `push: branches: [main]`, deploying the dev Studio:
  `SANITY_STUDIO_DATASET=development`, `SANITY_STUDIO_HOSTNAME=valovinnikov-blog-dev`,
  `sanity deploy`. Optional path filter: only run when `apps/cms/**` or
  `packages/config/**` changed.

### 4c. Push tag `v*` → production

A new workflow `.github/workflows/deploy-production.yml` runs on
`push: tags: ['v*']`. A **`verify` gate job runs first** and must pass before any
deploy job runs:

- **`verify` (gate):** checks out the tagged commit and re-runs the full quality
  suite (`type-check`, `lint`, `test`, `build`) via the existing
  `.github/actions/setup` composite. Because a tag can point at any commit with no
  PR gate, this guarantees the exact commit being promoted is green before it
  reaches production. The `deploy-studio` and `deploy-web` jobs declare
  `needs: verify`.
- **Studio:** `SANITY_STUDIO_DATASET=production`,
  `SANITY_STUDIO_HOSTNAME=valovinnikov-blog`, `sanity deploy`.
- **Web:** deploy `blog-prod` via Vercel CLI against `production`:
  ```sh
  vercel pull --yes --environment=production --token=$VERCEL_TOKEN
  vercel build --prod --token=$VERCEL_TOKEN
  vercel deploy --prebuilt --prod --token=$VERCEL_TOKEN
  ```
  `blog-prod` has Git auto-deploy disabled (Ignored Build Step always returns
  "skip"), so `main` pushes never reach production — only the tag workflow does.

## 5. Web on Vercel — two projects

- **`blog-dev`** — Git-connected, Production Branch = `main`, PR previews on.
  Env vars point at `development`.
- **`blog-prod`** — Git-connected only so the CLI can resolve the project, but
  **Ignored Build Step** returns skip for all Git events. Deployed exclusively by
  the tag workflow. Env vars point at `production`.

Full isolation: separate domains, env vars, and webhooks per project. Cost: the
env-var set is entered twice (once per project).

## 6. Studio deploy — env-driven hostname

`apps/cms/sanity.cli.ts` is already env-driven on `SANITY_STUDIO_DATASET`. It
must also become env-driven on the **studio hostname** so CI can deploy two
hostnames non-interactively. Add `studioHost` sourced from a new
`SANITY_STUDIO_HOSTNAME` env var (owned by the `cms` agent). Locally this var is
unset (only needed for `deploy`, which humans don't run locally).

## 7. Datasets

- Create a **`development`** dataset in Sanity (human, manage.sanity.io).
  Visibility public is fine (mirrors `production`).
- `production` already planned in #271.
- Local dev (`apps/cms/.env`, `apps/web/.env.local`) points at `development`.
- **Content note:** the two datasets have independent content. `development`
  starts empty unless seeded (copy from production via
  `sanity dataset export/import`, or author fresh dev content). Decide seeding
  separately; not blocking.

## 8. Revalidation webhooks — one per environment

Two Sanity webhooks (from #274's already-built `/api/revalidate` route):

| Webhook | Dataset       | Target URL                                   | Secret                                  |
| ------- | ------------- | -------------------------------------------- | --------------------------------------- |
| dev     | `development` | `https://blog-dev.vercel.app/api/revalidate` | `SANITY_REVALIDATE_SECRET` (dev value)  |
| prod    | `production`  | `https://blog.vercel.app/api/revalidate`     | `SANITY_REVALIDATE_SECRET` (prod value) |

Each secret matches the corresponding Vercel project's env var. Projection
`{_type, _id, "slug": slug.current}` as in the existing route.

## 9. Secrets & env inventory

**GitHub Actions repo secrets (new):**

- `SANITY_AUTH_TOKEN` — Sanity robot token with **Deploy Studio** (write)
  permission; used by `sanity deploy` in both workflows. (Distinct from the
  read-only `SANITY_API_READ_TOKEN`.)
- `VERCEL_TOKEN` — Vercel access token for the CLI.
- `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` — for `blog-prod` (from `vercel link`).
- `SANITY_STUDIO_PROJECT_ID` — Sanity project id (env, can be a secret/variable).

**Vercel env vars per project** (Production + Preview scopes), values differ only
in dataset/URL/secret:
`NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`,
`NEXT_PUBLIC_SITE_URL`, `SANITY_API_READ_TOKEN`, `SANITY_REVALIDATE_SECRET`.
(One project-scoped Viewer `SANITY_API_READ_TOKEN` can read both datasets.)

## 10. Repo code changes (what the agents build)

1. `apps/cms/sanity.cli.ts` — add env-driven `studioHost`
   (`SANITY_STUDIO_HOSTNAME`). _(cms agent)_
2. `.github/workflows/deploy-development.yml` — Studio deploy on `main`. _(new)_
3. `.github/workflows/deploy-production.yml` — Studio + web (Vercel CLI) on `v*`
   tags. _(new)_
4. Reuse the existing `.github/actions/setup` composite for pnpm/node/install.
5. Docs: update `SPEC.md` (deploy topology + env matrix) and the deploy issues
   (#272/#273) to reflect two environments; note the pipeline in `CLAUDE.md`'s
   deploy section.

No changes to `@blog/ui`, `@blog/service`, or web runtime code — this is
infra-only.

## 11. One-time human setup (gated, not automated)

1. Create `development` dataset; confirm `production`.
2. Mint tokens: read-only `SANITY_API_READ_TOKEN` (Viewer), deploy
   `SANITY_AUTH_TOKEN` (write/Deploy).
3. Create Vercel projects `blog-dev` and `blog-prod` (root `apps/web`, "include
   files outside root", Node 22); set env vars per §9; set `blog-prod` Ignored
   Build Step to always-skip; `vercel link` `blog-prod` and record ORG/PROJECT id.
4. Add GitHub Actions secrets (§9).
5. First Studio deploys to claim both hostnames (or let the first workflow run
   claim them).
6. Create the two Sanity webhooks (§8).
7. Sanity CORS: dev + prod studio hostnames (credentials on), both web URLs
   (credentials off), `localhost:3333` (credentials on).

## 12. Ongoing runbook

- **Feature work:** branch → PR (preview builds) → merge to `main` → auto-deploys
  to development → validate on the dev site/Studio.
- **Release:** when `main` looks good, `git tag vX.Y.Z && git push origin vX.Y.Z`
  → production deploys automatically.

Note: this pipeline **intentionally automates deploys** that are otherwise
human-gated in this repo — that is the explicit purpose here. The one-time setup
(§11) is human; steady-state deploys are CI-driven by merge/tag.

## 13. Out of scope / future

- Custom domains (#275).
- Automated version bumping (release-please/changesets).
- Seeding/refreshing the `development` dataset from production.
- Preview deployments pointing at a dedicated preview dataset (they currently use
  `development`).
- Rollback strategy (tag an older commit / redeploy a prior Vercel build).

## 14. Risks / open questions

- **Vercel single production branch** — mitigated by two projects; `blog-prod`
  never auto-deploys.
- **Tag on a red commit** — a `v*` tag deploys whatever commit it points at with
  no PR gate. Mitigated by the mandatory `verify` gate job (§4c): deploy jobs run
  only after `type-check`/`lint`/`test`/`build` pass on the exact tagged commit.
- **Deploy token scope** — `SANITY_AUTH_TOKEN` must have deploy permission;
  Viewer is insufficient.
- **Dev Studio redeploy churn** — Studio rarely changes; path-filter the dev
  workflow to avoid redeploying on content-only/web-only merges.
