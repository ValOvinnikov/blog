# @blog/db

> Typed relational data access for the engagement layer — Neon Postgres via Drizzle.

This package owns every table this blog stores outside Sanity: Auth.js
sessions/accounts, comments, ratings, bookmarks, newsletter subscribers, and
the multi-tenant registry (`tenants`, `tenant_domains`, `memberships`,
`admins`, `site_config`). It is the Neon/Drizzle counterpart to
`@blog/service`'s Sanity/GROQ role — same "typed queries in, view-model types
out" contract, a different store, and the two never reference each other.

## Layer contract

- **Depends on:** `@blog/config`, `@blog/utils`, plus the Drizzle/Neon SDKs
  (`drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless`). `@sanity/client`
  is a dependency too, but scoped to one directory (see below).
- **Consumed by:** `apps/web`, `apps/platform`, and `@blog/auth` (which binds the
  Auth.js Drizzle adapter to the tables in `src/schema/auth.ts`).
- **Never imports:** React, any Sanity SDK, or `@blog/service` — this package
  and `service` are siblings, not dependents; a feature needing both Sanity
  content and relational data joins them in `apps/web`, not inside either data
  package. It also never imports `@blog/auth` — `auth` sits above `db` and
  reaches for its tables, never the reverse.

**One scoped exception:** `scripts/provision-tenant/` imports `@sanity/client`
directly to create a new tenant's Sanity project/dataset/CORS entry and seed
its starter content via Sanity's Management API — a different concern from
`service`'s content-read facade. A dedicated `configs/eslint/db.js` override
scopes the exception to that one directory; every other path in this package
keeps the blanket Sanity-SDK prohibition.

## Layout

- `src/client.ts` — `getDb()`, the pooled Neon HTTP driver every query/mutation
  runs against at runtime.
- `src/schema/` — one Drizzle `pgTable` file per domain (`auth`, `admins`,
  `bookmarks`, `memberships`, `site-config`, `subscribers`, `tenant-domains`,
  `tenants`), barrel-exported from `src/schema/index.ts`.
- `src/queries/` — one folder per domain (`account`, `admins`, `bookmarks`,
  `memberships`, `site-config`, `subscribers`, `tenant-domains`, `tenants`,
  `users`), each holding one subfolder per query/mutation
  (`{name}.ts` + `{name}.test.ts` + `index.ts`), barrel-exported from
  `src/queries/index.ts` as `db.queries.<domain>.<fn>`.
- `src/testing/` — `createTestDb()`, an in-memory Postgres (via `pglite`) with
  every committed migration applied, used by query/mutation tests.
- `src/utils/env/` — the validated `env` object (`t3-oss/env-core`) `getDb()`
  and the provisioning scripts read instead of raw `process.env`.
- `scripts/` — human- or CI-invoked entrypoints that call the query layer
  directly (`seed-tenant.ts`, `seed-admin.ts`, `provision-tenant/`,
  `deprovision-tenant/`); never imported by `apps/web`/`apps/platform`.
- `migrations/` — the generated, committed SQL migration history plus
  drizzle-kit's snapshot metadata (`migrations/meta/`).

## Scripts

| Script                  | Command                                                                            | What it does                                                                                                                                                                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type-check`            | `pnpm --filter @blog/db type-check`                                                | `tsc --noEmit`.                                                                                                                                                                                                                    |
| `lint`                  | `pnpm --filter @blog/db lint`                                                      | `eslint .`.                                                                                                                                                                                                                        |
| `format`                | `pnpm --filter @blog/db format`                                                    | `prettier --write .`.                                                                                                                                                                                                              |
| `test`                  | `pnpm --filter @blog/db test`                                                      | `vitest run --passWithNoTests`.                                                                                                                                                                                                    |
| `test:watch`            | `pnpm --filter @blog/db test:watch`                                                | `vitest` in watch mode.                                                                                                                                                                                                            |
| `db:generate`           | `pnpm --filter @blog/db db:generate`                                               | `drizzle-kit generate` — diffs `src/schema/` against the last migration and writes a new timestamped SQL file plus snapshot under `migrations/`. Touches no database; this is the schema-change dry run.                           |
| `db:migrate`            | `pnpm --filter @blog/db db:migrate`                                                | `drizzle-kit migrate` — applies any un-applied migration file to the Neon branch pointed at by `DATABASE_URL_UNPOOLED`.                                                                                                            |
| `db:studio`             | `pnpm --filter @blog/db db:studio`                                                 | `drizzle-kit studio` — local, read/write table browser against the same connection; inspection only.                                                                                                                               |
| `db:seed-tenant`        | `pnpm --filter @blog/db db:seed-tenant -- --slug=... ...`                          | Runs `scripts/seed-tenant.ts` — creates/reuses a `tenants` row, its domain(s), and grants an existing user `OWNER` membership. Manual, human-run only.                                                                             |
| `db:seed-admin`         | `pnpm --filter @blog/db db:seed-admin -- --email=... --role=...`                   | Runs `scripts/seed-admin.ts` — grants an existing user a platform-admin `admins` row. Manual, human-run only.                                                                                                                      |
| `db:provision-tenant`   | `pnpm --filter @blog/db db:provision-tenant -- --tenant-id=...`                    | Runs `scripts/provision-tenant/run.ts` — the five-step tenant provisioning workflow (Sanity project, seed content, token persistence, domain mapping, revalidate webhook). Invoked only by the `provision-tenant.yml` CI workflow. |
| `db:deprovision-tenant` | `pnpm --filter @blog/db db:deprovision-tenant -- --tenant-id=... --confirm=<slug>` | Runs `scripts/deprovision-tenant/run.ts` — reverses provisioning and archives the tenant row. Defaults to a dry run; invoked only by the `deprovision-tenant.yml` CI workflow.                                                     |

The root-level `pnpm type-check`, `pnpm lint`, and `pnpm test` run every
workspace, including this one, through Turborepo.

### Migrations

`db:generate` produces the reviewable SQL diff under `migrations/` — that
generation step _is_ the dry run, since drizzle-kit never touches a database
at generate time. Applying to the shared/production Neon branch is
human-gated in CI, backed up first (`pg_dump` against
`DATABASE_URL_UNPOOLED`), never run by hand. A migration that has already
been applied anywhere shared is never hand-edited — write a new corrective
migration instead. Full mechanism: [`../../SPEC.md`](../../SPEC.md) §8 and
[`../../.claude/agents/db.md`](../../.claude/agents/db.md).

## Further reading

- [`../../SPEC.md`](../../SPEC.md) §4 (layer contracts) and §8 (migrations & live data)
- [`../../docs/context/environment-variables.md`](../../docs/context/environment-variables.md) — `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `TENANT_TOKEN_ENCRYPTION_KEY`
- [`.env.example`](./.env.example) — the env vars this package reads, with usage notes
