# cms

> Sanity Studio (v6) — authors the content model and content for the blog.

This app defines every content shape (documents, pages, singletons, reusable
modules, and shared objects) as Sanity schemas and is the studio editors use
to author it. It does not import or re-export those shapes directly — it
generates them via Sanity typegen into `@blog/config`, which is how every
other layer consumes the content model.

## Layer contract

- **Depends on:** `@blog/config`, `@blog/utils`
- **Consumed by:** nothing imports `cms` as a package — its output reaches
  the rest of the monorepo indirectly, via the generated types it produces in
  `packages/config/src/sanity/generated/`
- **Never imports:** `@blog/service`, `@blog/ui`, `@blog/db`, `@blog/auth`, or
  any app (`web`, `admin`)

## Layout

- `src/schema-types/documents/` — document types, grouped by area:
  `blog/` (`blog_post`, `blog_author`, `blog_category`, `blog_tag`),
  `pages/` (`page_home`, `page_blog`, `page_generic`), and `settings/`
  (singletons: `settings_site`, `settings_navigation`, `settings_footer`,
  `settings_newsletter`, `settings_theme`, `settings_voice`)
- `src/schema-types/modules/` — reusable page modules
  (`module_hero`, `module_postList`, `module_content`, `module_cta`,
  `module_newsletter`)
- `src/schema-types/objects/` — shared object types (`link`, `socialLink`,
  `brand`, `imageWithAlt`, `richText`, `blockText`, `seo`, `openGraph`, …)
- `src/schema-types/helpers/` — DRY field factories reused across schemas
  (e.g. `define-modules-field.ts`, `section-header-field.ts`)
- `src/schema-types/components/` — custom Studio input components
- `sanity.config.ts`, `sanity.cli.ts` — Studio and CLI config, including the
  typegen input/output paths (root-level by Sanity CLI convention, not under
  `src/`)
- `migrations/` — content migrations for the live dataset; see
  [`./migrations/README.md`](./migrations/README.md)

## Scripts

| Script       | Command                        |
| ------------ | ------------------------------ |
| `dev`        | `sanity dev`                   |
| `build`      | `sanity build`                 |
| `deploy`     | `sanity deploy`                |
| `typegen`    | `node scripts/typegen.mjs`     |
| `lint`       | `eslint .`                     |
| `type-check` | `tsc --noEmit`                 |
| `test`       | `vitest run --passWithNoTests` |
| `test:watch` | `vitest`                       |
| `format`     | `prettier --write .`           |

Migration and dataset scripts (`scripts/migrate.mjs` and
`scripts/refresh-dev-dataset.mjs`) — see
[`./migrations/README.md`](./migrations/README.md) for the full workflow:

| Script                | Command                                      |
| --------------------- | -------------------------------------------- |
| `migrate:list`        | `sanity migrations list`                     |
| `migrate:new`         | `node scripts/migrate.mjs new`               |
| `migrate:track`       | `node scripts/migrate.mjs track`             |
| `migrate:current`     | `node scripts/migrate.mjs current`           |
| `migrate:dry`         | `node scripts/migrate.mjs dry`               |
| `migrate:run`         | `node scripts/migrate.mjs run`               |
| `migrate:deploy`      | `node scripts/migrate.mjs deploy`            |
| `migrate:backfill`    | `node scripts/migrate.mjs deploy --backfill` |
| `dataset:export`      | `node scripts/migrate.mjs export`            |
| `dataset:refresh-dev` | `node scripts/refresh-dev-dataset.mjs`       |

From the repo root, `pnpm type-check`, `pnpm lint`, and `pnpm test` run this
package's checks alongside every other workspace's, via Turborepo.

## Typegen

`pnpm --filter cms typegen` extracts the schema and regenerates
`packages/config/src/sanity/generated/schema.json` and `types.ts`. Those
generated files are committed and are the single source of truth for content
shapes everywhere downstream — never hand-edit them and never hand-redeclare
a content shape elsewhere. If a generated type looks wrong, the schema here
is wrong; fix it in `src/schema-types/` and re-run typegen.

## Human-gated operations

Two operations here are never run by an automated agent:

- `sanity deploy` (deploying the Studio)
- Running a migration against the `production` dataset

See [`./migrations/README.md`](./migrations/README.md) for the dry-run →
backup → gated-run migration workflow.

## Further reading

- [`../../SPEC.md`](../../SPEC.md) — architecture and content model (§6)
- [`./migrations/README.md`](./migrations/README.md) — migration workflow and guardrails
- [`../../docs/DEPLOY.md`](../../docs/DEPLOY.md) — deployment topology
