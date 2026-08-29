# @blog/studio

> Sanity Studio (v6) — the content model, desk structure, and a mount
> component that renders the Studio inside `apps/platform`.

This package defines every content shape (documents, pages, singletons,
reusable modules, and shared objects) as Sanity schemas. It does not import
or re-export those shapes directly — it generates them via Sanity typegen
into `@blog/config`, which is how every other layer consumes the content
model.

It exports two things: the schema/desk structure (consumed by typegen, and
by the CLI-facing `sanity.config.ts` for local `sanity dev`), and a
`StudioMount` component that `apps/platform` mounts to serve every tenant's
Studio from one deployment.

## Layer contract

- **Depends on:** `@blog/config`, `@blog/utils`
- **Consumed by:** `apps/platform` (via the exported `StudioMount`
  component); every other layer only ever consumes the generated types this
  package produces in `packages/config/src/sanity/generated/`, not the
  package itself
- **Never imports:** `@blog/service`, `@blog/ui`, `@blog/db`, `@blog/auth`,
  or any app
- **The one package permitted a `'use client'` directive.** Every other rule
  in this repo bans it outright (`@blog/ui` must stay pure and
  server-agnostic). `src/studio-mount.tsx` is the sole exception: Sanity
  Studio only runs client-side, and a Server Component calling the config
  builder and passing the built object out pulls the Sanity SDK into
  Turbopack's RSC server graph, where several of its dependencies break
  under the `react-server` export condition. The directive has to sit on the
  component that _calls_ the builder, not just wrap one that receives an
  already-built config.

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
- `src/studio-structure.ts` — the desk structure, directive-free
- `src/studio-config.ts` — `buildStudioConfig`, which assembles schema +
  desk structure + plugins into a Sanity `Config`, directive-free so it can
  be called from both the plain CLI config and the client-mounted component
- `src/studio-mount.tsx` — `StudioMount`, the only `'use client'` file in
  this package; calls `buildStudioConfig` and renders `sanity`'s
  `StudioProvider`/`StudioLayout`
- `sanity.config.ts`, `sanity.cli.ts` — Studio and CLI config, including the
  typegen input/output paths (root-level by Sanity CLI convention, not under
  `src/`)
- `migrations/` — content migrations for the live dataset; see
  [`./migrations/README.md`](./migrations/README.md)

## Using the mount component

```tsx
import { StudioMount } from '@blog/studio';

export default function StudioPage() {
  return (
    <StudioMount
      projectId={tenant.sanityProjectId}
      dataset={tenant.sanityDataset}
      basePath="/dashboard/studio"
      title="My Blog Studio"
    />
  );
}
```

The consuming Server Component passes only plain strings — never a built
config object — so the Sanity SDK never crosses into the RSC server graph.

## Scripts

| Script       | Command                        |
| ------------ | ------------------------------ |
| `dev`        | `sanity dev`                   |
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

`pnpm --filter @blog/studio typegen` extracts the schema and regenerates
`packages/config/src/sanity/generated/schema.json` and `types.ts`. Those
generated files are committed and are the single source of truth for content
shapes everywhere downstream — never hand-edit them and never hand-redeclare
a content shape elsewhere. If a generated type looks wrong, the schema here
is wrong; fix it in `src/schema-types/` and re-run typegen.

## Human-gated operations

This package is not itself deployed — `apps/platform` mounts it, and
`apps/platform`'s own deploy pipeline owns that gate. The one operation here
that's still never run by an automated agent is running a migration against
the `production` dataset. See
[`./migrations/README.md`](./migrations/README.md) for the dry-run → backup
→ gated-run migration workflow.

## Further reading

- [`../../SPEC.md`](../../SPEC.md) — architecture and content model (§6)
- [`./migrations/README.md`](./migrations/README.md) — migration workflow and guardrails
