# Frontend & monorepo conventions

> Part of the docs split described in [`docs/README.md`](../README.md). The
> layer contracts summarized here are defined authoritatively in `SPEC.md`
> §4 — this file is implementation detail one level down from that contract.

## Dependency rules (enforced, acyclic)

```
web → ui, service, db, config, utils
service → config, utils   (no React, ever)
db → config, utils        (no React, no Sanity SDK — sibling to service, not a dependent)
ui → config               (no Sanity, no data fetching — stays publishable)
cms → config              (generates the types typegen ships into config)
configs/* → consumed by all
```

`web` is the **only** place `ui`, `service`, and `db` meet: Server Components
fetch Sanity data through `service`, relational data through `db`, and pass
plain typed props into `ui`. `db` and `service` never import each other — a
feature needing both joins them in `web`. Internal packages ship raw
TypeScript (Just-in-Time pattern) and are transpiled by the web app via
`transpilePackages`.

## Type flow

```
Sanity schema (cms) ──typegen──► @blog/config ──► @blog/service ──► web ──props──► @blog/ui
```

One source of truth: a schema change surfaces as a TypeScript error anywhere a
consumer is out of date.

## SVG icon imports

`@blog/ui` ships its icon set as raw SVGs under `packages/ui/src/assets/icons/`
(the design-reference copy that seeded these has been removed — this is the
sole source now). SVGR turns a bare `.svg` import into
a typed React component; the `?url` suffix bypasses SVGR and resolves to the
emitted asset's URL instead — same two-shape convention everywhere it's
configured:

- **Next.js/Turbopack** (`apps/web/next.config.ts`) — `turbopack.rules` with
  `@svgr/webpack`, split by a `condition.query` match on `?url`. `@blog/ui`
  ships from source (`transpilePackages`), so Turbopack sees these imports
  directly wherever `@blog/ui` is consumed.
- **Storybook** (`packages/ui/.storybook/main.ts`, `apps/web/.storybook/main.ts`)
  and **Vitest** (`packages/ui/vitest.config.ts`, `apps/web/vitest.config.ts`)
  — both Vite-based, so `vite-plugin-svgr` (`include: '**/*.svg'`) handles the
  component case; the `?url` case needs no extra config since it's Vite's own
  built-in asset-URL handling.

Ambient module types (`declare module '*.svg'` / `'*.svg?url'`) live in
`packages/ui/src/assets/icons/svg.d.ts`. `@blog/ui`'s own `tsconfig.json`
picks them up via its `src` include; **`apps/web/tsconfig.json` also globs
them in** (`../../packages/ui/src/**/*.d.ts`) — `@blog/ui` exports a wildcard
subpath (`"./*": "./src/*"`), so web's `@blog/ui/*` alias resolves straight to
`@blog/ui` source, and `tsc` type-checks that source (including any raw
`.svg` import it makes) as part of web's own program. TypeScript never picks
up a global ambient `.d.ts` transitively through import resolution — only via
each program's own `include` — so both tsconfigs need the glob independently.
`apps/web/next.config.ts` also sets `images.disableStaticImages: true`
(unused otherwise — all imagery is remote Sanity CDN URLs) so Next's own
built-in `declare module '*.svg' { const content: any }` shim
(`next/image-types/global.d.ts`) never lands in `next-env.d.ts` and conflicts
with `@blog/ui`'s typed declaration for the same wildcard pattern.
