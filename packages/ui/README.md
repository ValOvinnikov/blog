# @blog/ui

> The design system: pure, prop-driven React components shared by both apps.

This package holds every reusable UI building block — atoms, molecules, and
organisms — used by `apps/web` and `apps/platform`. It exists so visual and
interaction patterns are defined once, typed once, and stay portable: a
component here takes plain typed props and renders markup, nothing more, so it
could be published to npm without edits.

## Layer contract

- **Depends on:** `@blog/config` (shared types and constants), `@blog/utils`,
  `@blog/tailwind-config` (design tokens, consumed via `theme.css`), and
  `tailwind-variants` for styling.
- **Consumed by:** `apps/web` and `apps/platform`.
- **Never imports:** `@blog/service`, `sanity`, `next-sanity`, `next/*`, or
  anything that fetches data. `'use client'` never appears in this package —
  components stay server-component-safe by default and accept
  `children`/`as`/slot props so the consuming app owns framework specifics.

## Layout

- `src/atoms/` — the smallest primitives (buttons, inputs, badges, icons, …).
- `src/molecules/` — components composed from atoms.
- `src/organisms/` — larger sections composed from molecules and atoms.
- `src/lib/` — internal helpers: `design-tokens` (parses and registers the
  design tokens from `@blog/tailwind-config`'s `theme.css`), `react` (compound
  component and heading-tag helpers), `styling` (the shared `tv()` wrapper).
- `src/assets/icons/` — SVG source assets.
- `src/testing/` — shared test utilities (a custom Testing Library render).

Every component is re-exported from `src/index.ts` (and per-layer barrels
`src/atoms/index.ts`, `src/molecules/index.ts`, `src/organisms/index.ts`).

## Scripts

| Script            | Command                                  |
| ----------------- | ---------------------------------------- |
| `lint`            | `pnpm --filter @blog/ui lint`            |
| `type-check`      | `pnpm --filter @blog/ui type-check`      |
| `format`          | `pnpm --filter @blog/ui format`          |
| `test`            | `pnpm --filter @blog/ui test`            |
| `test:watch`      | `pnpm --filter @blog/ui test:watch`      |
| `storybook`       | `pnpm --filter @blog/ui storybook`       |
| `storybook:build` | `pnpm --filter @blog/ui storybook:build` |

The root-level `pnpm type-check`, `pnpm lint`, and `pnpm test` run every
workspace, including this one, through Turborepo.

## Further reading

- [`COMPONENTS.md`](./COMPONENTS.md) — the generated index of every exported
  component: its purpose, props, and compound slots. It's produced by
  `scripts/gen-ui-index.mjs`, regenerated automatically by the pre-commit hook
  on staged `packages/ui` changes, and checked in CI via
  `pnpm gen:ui-index:check`. Never hand-edit it — fix the source component and
  regenerate. Check it before adding a new component, to spot one to reuse or
  extend instead.
- [`../../SPEC.md`](../../SPEC.md) — overall architecture and layer contracts.
- [`../../.claude/skills/ui-library-practices/SKILL.md`](../../.claude/skills/ui-library-practices/SKILL.md) —
  conventions for building components in this package.
- [`../../.claude/skills/ui-storybook/SKILL.md`](../../.claude/skills/ui-storybook/SKILL.md) —
  conventions for Storybook stories in this package.
