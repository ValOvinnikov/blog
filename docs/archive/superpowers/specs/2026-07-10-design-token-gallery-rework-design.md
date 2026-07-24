# Design: auto-parsed Storybook design-token gallery (rework of #210)

> **Archived — implemented.** See `packages/ui/src/lib/design-tokens/` for
> current behavior (no dedicated `SPEC.md` section — internal design-system
> tooling).

Date: 2026-07-10
Status: Approved (design), pending implementation plan
Supersedes the flat gallery currently on PR #215 (updates the same branch).

## Problem

The current `packages/ui/src/design-tokens/` gallery (PR #215) hardcodes every
token **name** in hand-written arrays (`surfaceColors`, `textColors`,
`accentColors`, …). Renaming or adding a token in `configs/tailwind/theme.css`
means editing the gallery too — the exact maintenance trap this rework removes.
The files are also flat/unstructured.

## Goals

1. **Zero per-token maintenance.** Token names come from the source of truth
   (`theme.css`); renaming a token touches only that file.
2. **Structured module**, not a flat pile of files.
3. Presentation per the approved mock: color as a `token · role · light · dark`
   table with light+dark shown **side by side**; typography as specimens; a
   shape/layout/motion section.

## Decisions

| Decision          | Choice                                                                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Token-name source | Parse `theme.css` **source text** (`@blog/tailwind-config/theme.css?raw`) at story-module load.                                                 |
| Token values      | Resolved **live in-browser** via two DOM probes (a plain node + a `.dark` node) — light and dark at once. Never parse OKLCH by hand.            |
| Roles             | Inline `/* @role … */` comments in `theme.css`, parsed alongside names (single source; travels with the token on rename).                       |
| Grouping          | Top-level category from the prefix; a small `token-registry.ts` config maps prefix → section (the only curated file, keyed on stable prefixes). |
| Sidebar           | **One story per group** under `title: 'Design Tokens'`; `Design Tokens` sorted **first**, before Atoms/Molecules/etc.                           |
| Spacing           | Larger gaps between rows and between sections than the current gallery.                                                                         |

## Module structure

The gallery lives under `src/lib/` (the package's home for internal,
non-component, non-exported code). `lib/` is also reorganized into **category
folders**, each with an `index.ts` barrel (matching the atoms/molecules
convention):

```
packages/ui/src/lib/
  styling/
    tv.ts                      # moved from lib/tv.ts
    index.ts                   # export { tv } from './tv'
  react/
    compound.tsx               # moved from lib/compound.tsx
    compound.test.tsx
    index.ts
  design-tokens/
    parse-theme-tokens.ts      # pure: (cssText) => TToken[]   (the parser)
    parse-theme-tokens.test.ts # unit tests
    token-registry.ts          # prefix→section map; groups parsed tokens
    use-token-values.ts        # hook: dual light/dark probes → { light, dark }
    components/
      token-section.tsx        # section shell (title + generous spacing)
      color-table.tsx          # token · role · light · dark
      type-specimens.tsx       # font + size descriptor + live sample
      shape-sample.tsx         # radius boxes
      kv-list.tsx              # layout / motion key–value lists
      token-chip.tsx           # a single resolved-value swatch
    design-tokens.stories.tsx  # one story export per group (Colour, Typography, …)
```

The old flat gallery files (`color-swatch.tsx`, `spacing-sample.tsx`,
`resolved-value.tsx`, etc.) are removed/absorbed. Nothing under `design-tokens/`
is exported from the package index — Storybook-only.

### Import-path updates (from the `lib/` reorg)

`@blog/ui/lib/*` resolves via the tsconfig/bundler path alias to
`src/lib/*`, and the new folder barrels keep resolution clean:

- `@blog/ui/lib/tv` → **`@blog/ui/lib/styling`** — updated in every
  `*-variants.ts` consumer (~all variant files).
- `@blog/ui/lib/compound` → **`@blog/ui/lib/react`** — updated in the 4
  organisms (`post-card`, `footer`, `hero`, `header`).

The `tv`/`compound` moves are a mechanical import-path refactor, logically
separate from the gallery feature (see **Scope**).

## The parser (`parse-theme-tokens.ts`)

Pure function, unit-tested independently.

- **Input:** raw `theme.css` text.
- **Output:** `TToken[]` where `TToken = { name: string; category: TCategory; cssVar: string; role?: string }`.
- Extracts custom-property definitions from the `@theme` / `@theme inline` blocks.
- Strips the category prefix for the display name (`--color-accent-solid` →
  `accent-solid`, utility `bg-accent-solid`); keeps the full `cssVar` for probing.
- **Skips modifiers** (`--*--line-height`, `--*--letter-spacing`).
- Category from prefix: `color→color`, `text→typography`, `font→font`,
  `radius→radius`, `spacing→spacing`, `container→layout`, easing/duration→`motion`.
- Reads a trailing `/* @role … */` comment when present; absent → `role`
  undefined (blank cell, never a crash).
- Parsing only extracts **names/roles** (robust regex over property lines);
  values are never parsed here.

## Value resolution (`use-token-values.ts`)

Render two off-screen probe elements once: one plain (light), one wrapped in a
`.dark` element. For each token, `getComputedStyle(probe).getPropertyValue(cssVar)`
gives the resolved light and dark values. The browser resolves `var()` chains
and OKLCH, so we display exactly what the theme defines — no manual parsing, and
both modes are shown simultaneously (no dependence on the toolbar toggle).

## Registry & stories

`token-registry.ts` groups `TToken[]` by category into ordered sections. The
story file exports **one story per group**:

```tsx
const meta = { title: 'Design Tokens' } satisfies Meta;
export const Colour: Story = {
  render: () => <ColorTable tokens={byCategory.color} />,
};
export const Typography: Story = {
  render: () => <TypeSpecimens tokens={byCategory.typography} />,
};
export const Fonts: Story = {
  render: () => <TypeSpecimens tokens={byCategory.font} fontOnly />,
};
export const Radius: Story = {
  render: () => <ShapeSample tokens={byCategory.radius} />,
};
export const Spacing: Story = {
  render: () => <KvList tokens={byCategory.spacing} />,
};
export const Motion: Story = {
  render: () => <KvList tokens={byCategory.motion} />,
};
```

Each export is a separate sidebar entry (`Design Tokens/Colour`, etc.). The
group list (story exports) is the only stable surface that grows when a whole
**new category** is added — token adds/renames need no story changes.

## Sidebar order & spacing

- `.storybook/preview.ts`: add
  `parameters.options.storySort = { order: ['Design Tokens', 'Atoms', 'Molecules', 'Organisms', 'Templates', '*'] }`
  so **Design Tokens** appears first.
- `token-section.tsx` and the tables use larger row gaps and section margins
  than the current gallery (concrete values chosen during implementation, via
  spacing tokens).

## `theme.css` annotations

One-time pass: add `/* @role … */` to the color tokens (surfaces, text, accent —
~14 lines). Example: `--accent: oklch(0.58 0.17 250); /* @role links / interactive */`.
Non-color categories don't need roles (their descriptor is the value/specimen).

## Testing

- Unit-test `parseThemeTokens` against a representative CSS sample: correct
  names, category mapping, modifier filtering, `@role` extraction, empty/missing
  role.
- `pnpm --filter @blog/ui type-check | lint | test` and
  `pnpm --filter @blog/ui storybook:build` pass.

## Purity / boundaries

- Stays within `@blog/ui`, Storybook-only, not exported from the index.
- No `service`/`sanity`/`next` imports. The only cross-package reference is the
  `?raw` import of `@blog/tailwind-config/theme.css` (a build asset, not code).

## Scope

Updates PR #215 (same branch, `docs/ui-design-tokens-gallery`). Replaces the
flat implementation; keeps the `Closes #210` linkage. The gallery is placed at
`src/lib/design-tokens/`.

The `lib/` category reorg (`tv`→`styling`, `compound`→`react` + barrels) is
tracked and shipped **separately in #230**, ideally first, so this gallery lands
into a tidy `lib/`. Placing `design-tokens/` under `lib/` does not itself depend
on #230.

## Acceptance criteria

- [ ] Token names/roles are parsed from `theme.css`; no token name is hardcoded
      in the gallery. Renaming a token in `theme.css` updates the gallery with no
      other edit.
- [ ] Color section shows `token · role · light · dark` with light+dark chips
      side by side; typography and shape/layout/motion sections render live.
- [ ] Each group is its own story under `Design Tokens`, which sorts first in the
      sidebar.
- [ ] Larger inter-row/section spacing than the current gallery.
- [ ] Parser unit-tested; `type-check | lint | test | storybook:build` pass.
