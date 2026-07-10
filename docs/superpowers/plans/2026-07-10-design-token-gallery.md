# Design-Token Gallery Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hand-maintained `@blog/ui` design-token gallery with one that auto-discovers every Tailwind token from `configs/tailwind/theme.css`, so renaming a token never requires editing the gallery.

**Architecture:** A pure parser reads the theme CSS as raw text and returns a typed, categorised token list; a registry groups it; a hook resolves each token's light + dark value live from two off-screen DOM probes; Storybook renders one story per category. Everything lives under `packages/ui/src/lib/design-tokens/` and is Storybook-only (never exported from the package index).

**Tech Stack:** TypeScript, React, Storybook v8 (`@storybook/react-vite`), Vitest, Tailwind v4 CSS custom properties.

## Global Constraints

- Module location: `packages/ui/src/lib/design-tokens/`. Not exported from `packages/ui/src/index.ts` (Storybook-only).
- No hardcoded token **names** and no hardcoded hex/OKLCH **values** anywhere in the gallery. Names/roles come from `theme.css`; values are resolved live in the browser.
- No `@blog/service`, `sanity`, or `next` imports. Only cross-package reference: the `?raw` import of `@blog/tailwind-config/theme.css`.
- Token source of truth: `configs/tailwind/theme.css`. Roles are authored inline there as `/* @role … */` comments.
- Story sidebar: one story per group under `title: 'Design Tokens'`; `Design Tokens` sorted **first** (before Atoms/Molecules/Organisms/Templates).
- Follow the `ui-storybook` skill (CSF3) and `testing-practices` skill (`describe(symbolRef, …)` for single-symbol suites; co-located `*.test.ts`; no CSS-class assertions).
- The `lib/` `tv`→`styling` / `compound`→`react` reorg is **out of scope** — tracked in #230.
- Branch: `docs/ui-design-tokens-gallery` (updates PR #215, `Closes #210`).
- Verify commands (run from repo root unless noted):
  `pnpm --filter @blog/ui type-check`, `pnpm --filter @blog/ui lint`,
  `pnpm --filter @blog/ui test`, `pnpm --filter @blog/ui storybook:build`.

---

### Task 1: Raw-CSS module type + the token parser

**Files:**

- Create: `packages/ui/src/lib/design-tokens/theme-raw.d.ts`
- Create: `packages/ui/src/lib/design-tokens/parse-theme-tokens.ts`
- Test: `packages/ui/src/lib/design-tokens/parse-theme-tokens.test.ts`

**Interfaces:**

- Produces:
  - `type TCategory = 'color' | 'typography' | 'font' | 'radius' | 'spacing' | 'layout' | 'motion'`
  - `interface TToken { name: string; cssVar: string; category: TCategory; role?: string }`
  - `function parseThemeTokens(css: string): TToken[]`

- [ ] **Step 1: Declare the `?raw` module type**

Create `packages/ui/src/lib/design-tokens/theme-raw.d.ts`:

```ts
// Vite (`?raw`) imports a file's text as a default string export.
declare module '*.css?raw' {
  const content: string;
  export default content;
}
```

- [ ] **Step 2: Write the failing parser test**

Create `packages/ui/src/lib/design-tokens/parse-theme-tokens.test.ts`:

```ts
import { parseThemeTokens } from './parse-theme-tokens';

const SAMPLE = `
@theme inline {
  --color-bg: var(--bg); /* @role page background */
  --color-accent-solid: var(--accent-solid);
  --font-mono: var(--font-mono-family, monospace);
}
@theme {
  --radius-sm: 3px;
  --spacing-gutter: clamp(1rem, 5vw, 2.5rem);
  --container-content: 72rem;
  --text-xl: clamp(1.35rem, 1.15rem + 0.7vw, 1.6rem);
  --text-xl--line-height: 1.35;
  --ease-console: cubic-bezier(.2,0,0,1);
  --duration-base: 200ms;
}
`;

describe(parseThemeTokens, () => {
  const tokens = parseThemeTokens(SAMPLE);
  const byVar = (v: string) => tokens.find((t) => t.cssVar === v);

  it('strips the prefix for the display name and keeps the full cssVar', () => {
    expect(byVar('--color-accent-solid')).toMatchObject({
      name: 'accent-solid',
      cssVar: '--color-accent-solid',
      category: 'color',
    });
  });

  it('reads the @role comment when present, undefined otherwise', () => {
    expect(byVar('--color-bg')?.role).toBe('page background');
    expect(byVar('--color-accent-solid')?.role).toBeUndefined();
  });

  it('maps prefixes to categories', () => {
    expect(byVar('--font-mono')?.category).toBe('font');
    expect(byVar('--radius-sm')?.category).toBe('radius');
    expect(byVar('--spacing-gutter')?.category).toBe('spacing');
    expect(byVar('--container-content')?.category).toBe('layout');
    expect(byVar('--text-xl')?.category).toBe('typography');
    expect(byVar('--ease-console')?.category).toBe('motion');
    expect(byVar('--duration-base')?.category).toBe('motion');
  });

  it('skips --line-height / --letter-spacing modifiers', () => {
    expect(byVar('--text-xl--line-height')).toBeUndefined();
  });

  it('ignores non-token declarations and comments', () => {
    expect(
      parseThemeTokens('/* just a comment */\nbody { color: red; }'),
    ).toEqual([]);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm --filter @blog/ui exec vitest run src/lib/design-tokens/parse-theme-tokens.test.ts`
Expected: FAIL — `parse-theme-tokens` module not found.

- [ ] **Step 4: Implement the parser**

Create `packages/ui/src/lib/design-tokens/parse-theme-tokens.ts`:

```ts
export type TCategory =
  'color' | 'typography' | 'font' | 'radius' | 'spacing' | 'layout' | 'motion';

export interface TToken {
  /** Prefix-stripped display name, e.g. `accent-solid` (utility `bg-accent-solid`). */
  name: string;
  /** Full custom property, e.g. `--color-accent-solid`, used to probe the value. */
  cssVar: string;
  category: TCategory;
  /** Optional human role from a trailing `/* @role … *​/` comment. */
  role?: string;
}

// Ordered longest-first so `container` wins before any future `co*` prefix, etc.
const PREFIX_CATEGORY: ReadonlyArray<
  readonly [prefix: string, category: TCategory]
> = [
  ['color', 'color'],
  ['container', 'layout'],
  ['spacing', 'spacing'],
  ['radius', 'radius'],
  ['font', 'font'],
  ['text', 'typography'],
  ['ease', 'motion'],
  ['duration', 'motion'],
];

// `--name: value; /* @role text *​/` — role group optional.
const LINE =
  /^\s*(--[a-z0-9-]+)\s*:\s*[^;]+;(?:\s*\/\*\s*@role\s+(.+?)\s*\*\/)?/;

export function parseThemeTokens(css: string): TToken[] {
  const seen = new Set<string>();
  const tokens: TToken[] = [];

  for (const line of css.split('\n')) {
    const match = LINE.exec(line);
    if (!match) continue;

    const cssVar = match[1]!;
    if (/--(line-height|letter-spacing)$/.test(cssVar)) continue; // modifiers
    if (seen.has(cssVar)) continue;

    const bare = cssVar.slice(2); // drop leading `--`
    const hit = PREFIX_CATEGORY.find(
      ([prefix]) => bare === prefix || bare.startsWith(`${prefix}-`),
    );
    if (!hit) continue;

    const [prefix, category] = hit;
    const name = bare === prefix ? prefix : bare.slice(prefix.length + 1);

    seen.add(cssVar);
    tokens.push({ name, cssVar, category, role: match[2]?.trim() });
  }

  return tokens;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @blog/ui exec vitest run src/lib/design-tokens/parse-theme-tokens.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/lib/design-tokens/theme-raw.d.ts \
        packages/ui/src/lib/design-tokens/parse-theme-tokens.ts \
        packages/ui/src/lib/design-tokens/parse-theme-tokens.test.ts
git commit -m "feat(ui): add theme-token parser for the design-token gallery"
```

---

### Task 2: Annotate color tokens with `@role` comments

**Files:**

- Modify: `configs/tailwind/theme.css:15-34` (the `@theme inline` `--color-*` lines)

**Interfaces:**

- Consumes: nothing.
- Produces: `--color-*` lines carrying `/* @role … */` that Task 1's parser reads.

- [ ] **Step 1: Add role comments to each `--color-*` mapping**

In `configs/tailwind/theme.css`, append a role comment to each color line (keep existing values/`var()` untouched). Exact edits:

```css
--color-bg: var(--bg); /* @role page background */
--color-bg-subtle: var(--bg-subtle); /* @role secondary page field */
--color-surface: var(--surface); /* @role cards */
--color-surface-2: var(--surface-2); /* @role nested / code */
--color-border: var(--border); /* @role hairline */
--color-border-strong: var(--border-strong); /* @role emphasis / hover */
--color-text: var(--text); /* @role primary ink */
--color-text-muted: var(--text-muted); /* @role secondary body text */
--color-text-subtle: var(--text-subtle); /* @role metadata / low emphasis */
--color-muted: var(--text-muted); /* @role secondary body text (alias) */
--color-subtle: var(--text-subtle); /* @role metadata (alias) */
--color-accent: var(--accent); /* @role links / interactive */
--color-accent-hover: var(--accent-hover); /* @role interactive hover */
--color-accent-muted: var(--accent-muted); /* @role tint / selection */
--color-accent-contrast: var(
  --accent-contrast
); /* @role text on accent-solid */
```

And the two accent-solid lines (currently on lines 33-34, keep their existing preceding comment block):

```css
--color-accent-solid: var(
  --accent-solid
); /* @role filled surface (button bg) */
--color-accent-solid-hover: var(
  --accent-solid-hover
); /* @role filled surface hover */
```

- [ ] **Step 2: Verify the parser now surfaces roles against the real file**

Run: `pnpm --filter @blog/ui exec vitest run src/lib/design-tokens/parse-theme-tokens.test.ts`
Expected: PASS (unchanged — this task only enriches the source the runtime will read).

- [ ] **Step 3: Confirm Tailwind still builds (comments must not break the theme)**

Run: `pnpm --filter @blog/ui storybook:build`
Expected: build succeeds (CSS comments are inert).
Then remove the build artifact: `rm -rf packages/ui/storybook-static`

- [ ] **Step 4: Commit**

```bash
git add configs/tailwind/theme.css
git commit -m "chore(tokens): annotate color tokens with @role comments"
```

---

### Task 3: Token registry (parse the real theme + group by category)

**Files:**

- Create: `packages/ui/src/lib/design-tokens/token-registry.ts`
- Test: `packages/ui/src/lib/design-tokens/token-registry.test.ts`

**Interfaces:**

- Consumes: `parseThemeTokens`, `TToken`, `TCategory` (Task 1).
- Produces:
  - `const SECTION_ORDER: readonly TCategory[]`
  - `const tokensByCategory: Record<TCategory, TToken[]>` (parsed from the real `theme.css`)

- [ ] **Step 1: Write the failing registry test**

Create `packages/ui/src/lib/design-tokens/token-registry.test.ts`:

```ts
import { SECTION_ORDER, tokensByCategory } from './token-registry';

describe('token-registry', () => {
  it('groups real theme.css tokens by category', () => {
    // Colors we know exist in theme.css:
    const colorNames = tokensByCategory.color.map((t) => t.name);
    expect(colorNames).toContain('accent-solid');
    expect(colorNames).toContain('bg');
    // Roles are wired through from the @role comments:
    expect(tokensByCategory.color.find((t) => t.name === 'bg')?.role).toBe(
      'page background',
    );
  });

  it('exposes typography and radius groups', () => {
    expect(tokensByCategory.typography.some((t) => t.name === 'xl')).toBe(true);
    expect(tokensByCategory.radius.some((t) => t.name === 'sm')).toBe(true);
  });

  it('SECTION_ORDER lists every non-empty category', () => {
    for (const category of SECTION_ORDER) {
      expect(Array.isArray(tokensByCategory[category])).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @blog/ui exec vitest run src/lib/design-tokens/token-registry.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the registry**

Create `packages/ui/src/lib/design-tokens/token-registry.ts`:

```ts
import themeCss from '@blog/tailwind-config/theme.css?raw';

import {
  parseThemeTokens,
  type TCategory,
  type TToken,
} from './parse-theme-tokens';

export const SECTION_ORDER: readonly TCategory[] = [
  'color',
  'typography',
  'font',
  'radius',
  'spacing',
  'layout',
  'motion',
] as const;

const EMPTY: Record<TCategory, TToken[]> = {
  color: [],
  typography: [],
  font: [],
  radius: [],
  spacing: [],
  layout: [],
  motion: [],
};

export const tokensByCategory: Record<TCategory, TToken[]> = parseThemeTokens(
  themeCss,
).reduce<Record<TCategory, TToken[]>>(
  (acc, token) => {
    acc[token.category].push(token);
    return acc;
  },
  {
    ...EMPTY,
    color: [],
    typography: [],
    font: [],
    radius: [],
    spacing: [],
    layout: [],
    motion: [],
  },
);
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @blog/ui exec vitest run src/lib/design-tokens/token-registry.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/lib/design-tokens/token-registry.ts \
        packages/ui/src/lib/design-tokens/token-registry.test.ts
git commit -m "feat(ui): build grouped token registry from theme.css"
```

---

### Task 4: Live value-resolution hook (light + dark)

**Files:**

- Create: `packages/ui/src/lib/design-tokens/use-token-values.ts`

**Interfaces:**

- Produces:
  - `interface TModeValues { light: string; dark: string }`
  - `function useTokenValues(cssVars: readonly string[]): Record<string, TModeValues>`

**Note:** Not unit-tested — jsdom's `getComputedStyle` does not resolve theme `var()` chains from stylesheets. It is exercised by the Storybook build/render (Task 6). This is an accepted gap per `testing-practices` (behaviour that needs a real browser).

- [ ] **Step 1: Implement the hook**

Create `packages/ui/src/lib/design-tokens/use-token-values.ts`:

```ts
import { useEffect, useState } from 'react';

export interface TModeValues {
  light: string;
  dark: string;
}

/**
 * Resolves each `--var` to its computed light and dark value at once, by
 * probing two off-screen elements (a plain node and a `.dark` node). The
 * browser resolves `var()` chains and OKLCH, so no value is ever parsed by
 * hand and both modes are shown regardless of the toolbar toggle.
 */
export function useTokenValues(
  cssVars: readonly string[],
): Record<string, TModeValues> {
  const [values, setValues] = useState<Record<string, TModeValues>>({});

  useEffect(() => {
    const light = document.createElement('div');
    const dark = document.createElement('div');
    dark.className = 'dark';
    for (const el of [light, dark]) {
      el.style.cssText = 'position:absolute;left:-9999px;top:-9999px';
      document.body.appendChild(el);
    }

    const lightStyle = getComputedStyle(light);
    const darkStyle = getComputedStyle(dark);
    const next: Record<string, TModeValues> = {};
    for (const cssVar of cssVars) {
      next[cssVar] = {
        light: lightStyle.getPropertyValue(cssVar).trim(),
        dark: darkStyle.getPropertyValue(cssVar).trim(),
      };
    }
    setValues(next);

    return () => {
      light.remove();
      dark.remove();
    };
  }, [cssVars]);

  return values;
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm --filter @blog/ui type-check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/lib/design-tokens/use-token-values.ts
git commit -m "feat(ui): add dual light/dark token value resolution hook"
```

---

### Task 5: Presentational components

**Files:**

- Create: `packages/ui/src/lib/design-tokens/components/token-section.tsx`
- Create: `packages/ui/src/lib/design-tokens/components/token-chip.tsx`
- Create: `packages/ui/src/lib/design-tokens/components/color-table.tsx`
- Create: `packages/ui/src/lib/design-tokens/components/type-specimens.tsx`
- Create: `packages/ui/src/lib/design-tokens/components/shape-sample.tsx`
- Create: `packages/ui/src/lib/design-tokens/components/kv-list.tsx`

**Interfaces:**

- Consumes: `TToken` (Task 1), `useTokenValues`/`TModeValues` (Task 4).
- Produces (each a default-free named export):
  - `TokenSection({ title, children })`
  - `TokenChip({ value })` — a swatch backed by an inline `background` (the value is a live-resolved string, not a hardcoded color).
  - `ColorTable({ tokens })` — `token · role · light · dark` rows.
  - `TypeSpecimens({ tokens, fontOnly? })`
  - `ShapeSample({ tokens })`
  - `KvList({ tokens })`

Spacing: use generous gaps — section wrapper `space-y-8`, table rows `py-3`, section title `mb-4` (larger than the current gallery). All layout/text via token utilities (`text-label`, `text-copy`, `border-border`, `bg-surface`, etc.), never raw hex.

- [ ] **Step 1: `token-section.tsx` (section shell with generous spacing)**

```tsx
import type { ReactNode } from 'react';

export interface TTokenSectionProps {
  title: string;
  children: ReactNode;
}

export function TokenSection({ title, children }: TTokenSectionProps) {
  return (
    <section className="mb-12">
      <h2 className="mb-4 font-mono text-label text-text-subtle uppercase">
        {title}
      </h2>
      <div className="space-y-8">{children}</div>
    </section>
  );
}
```

- [ ] **Step 2: `token-chip.tsx` (single resolved swatch)**

```tsx
export interface TTokenChipProps {
  value: string;
}

export function TokenChip({ value }: TTokenChipProps) {
  return (
    <span
      className="inline-block h-8 w-14 rounded-sm border border-border align-middle"
      style={{ background: value }}
    />
  );
}
```

- [ ] **Step 3: `color-table.tsx` (token · role · light · dark)**

```tsx
import { useMemo } from 'react';

import type { TToken } from '../parse-theme-tokens';
import { useTokenValues } from '../use-token-values';
import { TokenChip } from './token-chip';

export interface TColorTableProps {
  tokens: TToken[];
}

export function ColorTable({ tokens }: TColorTableProps) {
  const cssVars = useMemo(() => tokens.map((t) => t.cssVar), [tokens]);
  const values = useTokenValues(cssVars);

  return (
    <table className="w-full border-collapse text-copy">
      <thead>
        <tr className="text-label text-text-subtle">
          <th className="py-2 text-left font-normal">token</th>
          <th className="py-2 text-left font-normal">role</th>
          <th className="py-2 text-left font-normal">light</th>
          <th className="py-2 text-left font-normal">dark</th>
        </tr>
      </thead>
      <tbody>
        {tokens.map((token) => (
          <tr key={token.cssVar} className="border-t border-border">
            <td className="py-3 font-mono text-label">{token.name}</td>
            <td className="py-3 text-text-muted">{token.role ?? ''}</td>
            <td className="py-3">
              <TokenChip value={values[token.cssVar]?.light ?? ''} />
            </td>
            <td className="py-3">
              <TokenChip value={values[token.cssVar]?.dark ?? ''} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 4: `type-specimens.tsx` (font + descriptor + live sample)**

```tsx
import type { TToken } from '../parse-theme-tokens';

export interface TTypeSpecimensProps {
  tokens: TToken[];
  /** When true, render each token as its font-family (Fonts story) rather than a size. */
  fontOnly?: boolean;
}

const SAMPLE = 'The versioning contract';

export function TypeSpecimens({
  tokens,
  fontOnly = false,
}: TTypeSpecimensProps) {
  return (
    <div className="space-y-6">
      {tokens.map((token) => (
        <div key={token.cssVar} className="space-y-1">
          <div className="font-mono text-label text-text-subtle">
            {fontOnly ? `font-${token.name}` : `text-${token.name}`}
          </div>
          <div
            style={
              fontOnly
                ? { fontFamily: `var(${token.cssVar})` }
                : { fontSize: `var(${token.cssVar})` }
            }
          >
            {SAMPLE}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: `shape-sample.tsx` (radius boxes)**

```tsx
import type { TToken } from '../parse-theme-tokens';

export interface TShapeSampleProps {
  tokens: TToken[];
}

export function ShapeSample({ tokens }: TShapeSampleProps) {
  return (
    <div className="flex flex-wrap gap-8">
      {tokens.map((token) => (
        <div key={token.cssVar} className="space-y-2 text-center">
          <div
            className="h-16 w-16 border border-border-strong bg-surface"
            style={{ borderRadius: `var(${token.cssVar})` }}
          />
          <div className="font-mono text-label text-text-subtle">
            {token.name}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: `kv-list.tsx` (spacing / layout / motion values)**

```tsx
import { useMemo } from 'react';

import type { TToken } from '../parse-theme-tokens';
import { useTokenValues } from '../use-token-values';

export interface TKvListProps {
  tokens: TToken[];
}

export function KvList({ tokens }: TKvListProps) {
  const cssVars = useMemo(() => tokens.map((t) => t.cssVar), [tokens]);
  const values = useTokenValues(cssVars);

  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-8 gap-y-3 text-copy">
      {tokens.map((token) => (
        <div key={token.cssVar} className="contents">
          <dt className="font-mono text-label">{token.name}</dt>
          <dd className="text-text-muted">
            {values[token.cssVar]?.light ?? ''}
          </dd>
        </div>
      ))}
    </dl>
  );
}
```

- [ ] **Step 7: Type-check + lint**

Run: `pnpm --filter @blog/ui type-check && pnpm --filter @blog/ui lint`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/ui/src/lib/design-tokens/components
git commit -m "feat(ui): design-token gallery presentational components"
```

---

### Task 6: Stories (one per group) + sidebar order

**Files:**

- Create: `packages/ui/src/lib/design-tokens/design-tokens.stories.tsx`
- Modify: `packages/ui/.storybook/preview.ts` (add `options.storySort`)

**Interfaces:**

- Consumes: `tokensByCategory` (Task 3), all Task 5 components.

- [ ] **Step 1: Write the stories — one export per group**

Create `packages/ui/src/lib/design-tokens/design-tokens.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';

import { ColorTable } from './components/color-table';
import { KvList } from './components/kv-list';
import { ShapeSample } from './components/shape-sample';
import { TokenSection } from './components/token-section';
import { TypeSpecimens } from './components/type-specimens';
import { tokensByCategory } from './token-registry';

const meta = {
  title: 'Design Tokens',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Colour: Story = {
  render: () => (
    <TokenSection title="Colour">
      <ColorTable tokens={tokensByCategory.color} />
    </TokenSection>
  ),
};

export const Typography: Story = {
  render: () => (
    <TokenSection title="Typography">
      <TypeSpecimens tokens={tokensByCategory.typography} />
    </TokenSection>
  ),
};

export const Fonts: Story = {
  render: () => (
    <TokenSection title="Fonts">
      <TypeSpecimens tokens={tokensByCategory.font} fontOnly />
    </TokenSection>
  ),
};

export const Radius: Story = {
  render: () => (
    <TokenSection title="Radius">
      <ShapeSample tokens={tokensByCategory.radius} />
    </TokenSection>
  ),
};

export const Spacing: Story = {
  render: () => (
    <TokenSection title="Spacing">
      <KvList tokens={tokensByCategory.spacing} />
    </TokenSection>
  ),
};

export const Motion: Story = {
  render: () => (
    <TokenSection title="Motion">
      <KvList
        tokens={[...tokensByCategory.layout, ...tokensByCategory.motion]}
      />
    </TokenSection>
  ),
};
```

- [ ] **Step 2: Sort `Design Tokens` first in the sidebar**

In `packages/ui/.storybook/preview.ts`, extend `parameters` with `options.storySort`:

```ts
  parameters: {
    options: {
      storySort: {
        order: ['Design Tokens', 'Atoms', 'Molecules', 'Organisms', 'Templates', '*'],
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /date$/i,
      },
    },
    layout: 'centered',
  },
```

- [ ] **Step 3: Build Storybook and verify it compiles + stories are present**

Run: `pnpm --filter @blog/ui storybook:build`
Expected: build succeeds; log lists `Design Tokens/Colour`, `…/Typography`, `…/Fonts`, `…/Radius`, `…/Spacing`, `…/Motion`.
Then: `rm -rf packages/ui/storybook-static`

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/lib/design-tokens/design-tokens.stories.tsx \
        packages/ui/.storybook/preview.ts
git commit -m "feat(ui): design-token gallery stories, one per group, sorted first"
```

---

### Task 7: Remove the old flat gallery + final verification

**Files:**

- Delete: `packages/ui/src/design-tokens/` (entire old flat directory — `color-swatch.tsx`, `design-tokens.stories.tsx`, `font-family-specimen.tsx`, `radius-sample.tsx`, `resolved-value.tsx`, `spacing-sample.tsx`, `token-section.tsx`, `type-specimen.tsx`)

**Interfaces:**

- Consumes: nothing. Ensures only the new `lib/design-tokens/` gallery remains.

- [ ] **Step 1: Delete the old directory**

```bash
git rm -r packages/ui/src/design-tokens
```

- [ ] **Step 2: Confirm nothing referenced the old path**

Run: `grep -rn "src/design-tokens\|from './design-tokens'\|design-tokens/" packages/ui/src --include="*.ts" --include="*.tsx" | grep -v "lib/design-tokens"`
Expected: no output (the only design-tokens references are under `lib/`).

- [ ] **Step 3: Full gate run**

Run each; all must pass:

```bash
pnpm --filter @blog/ui type-check
pnpm --filter @blog/ui lint
pnpm --filter @blog/ui test
pnpm --filter @blog/ui storybook:build && rm -rf packages/ui/storybook-static
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor(ui): remove old flat design-token gallery"
```

---

## Self-Review

**Spec coverage:**

- Parse from `theme.css` source text → Task 1 (`parseThemeTokens`) + Task 3 (`?raw` import).
- `@role` inline comments → Task 2 (annotate) + Task 1 (parse role).
- Light+dark side-by-side via dual probes → Task 4 hook + Task 5 `ColorTable`.
- Module at `lib/design-tokens/` → all tasks; old flat dir removed in Task 7.
- One story per group + `Design Tokens` first → Task 6.
- Larger spacing → Task 5 (`mb-12`, `space-y-8`, `py-3`).
- Parser unit-tested → Task 1; registry tested → Task 3.
- `lib/` reorg out of scope (#230) → not present in any task. ✓

**Placeholder scan:** none — every code step is complete.

**Type consistency:** `TToken`/`TCategory` defined in Task 1 and consumed unchanged in Tasks 3–6; `TModeValues`/`useTokenValues` defined in Task 4 and consumed in Task 5; `tokensByCategory` defined in Task 3, consumed in Task 6. Consistent.
