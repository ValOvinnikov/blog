# Getting started

> Part of the docs split described in [`docs/README.md`](../README.md). See
> the root [`README.md`](../../README.md) for what this project is; this file
> is how to run it locally.

## Requirements

**Node 20.19+** and **pnpm 11+**.

## Install & configure

```bash
pnpm install

# Copy env templates and fill in your Sanity project values
cp apps/web/.env.example apps/web/.env.local
cp packages/studio/.env.example packages/studio/.env.local
```

Local-dev environment variables (see each app's `.env.example` for the full,
authoritative list — this is the subset you need to get `pnpm dev` running;
the complete reference, including deploy/CI-only vars, is
[`docs/context/environment-variables.md`](./environment-variables.md)):

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

## Dev ports

Each dev server binds an explicit, fixed port so `pnpm dev` can run every app
at once without one silently falling back to a different port:

| App / tool                       | Port   |
| -------------------------------- | ------ |
| `apps/web` (`next dev`)          | `3000` |
| `apps/platform` (`next dev`)     | `3001` |
| `packages/studio` (`sanity dev`) | `3333` |
| `packages/ui` Storybook          | `6006` |
| `apps/web` Storybook             | `6007` |

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
`dependencies` for `packages/studio`/`apps/web`, `peerDependencies` for
`packages/ui`) confirmed this alongside the earlier `devDependencies`-only
migrations.

## Deploying

Deploys are automated by CI, not run by hand — see
[`docs/DEPLOY.md`](../DEPLOY.md) for the one-time environment setup (datasets,
tokens, Vercel projects, secrets, webhooks, CORS) and the release runbook, and
[`docs/context/ci-automation.md`](./ci-automation.md) for what each workflow
does.
