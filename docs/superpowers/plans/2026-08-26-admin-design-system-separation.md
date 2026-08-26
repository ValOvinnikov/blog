# apps/admin Design-System Separation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Layer ownership:** every file below lives in `apps/admin` or `packages/ui`.
> Per `CLAUDE.md`, those belong to the `admin-app` and `ui` subagents
> respectively — the orchestrator dispatches, it does not hand-author them.
> Only `SPEC.md`, `CLAUDE.md` and `docs/**` are orchestrator-owned.

**Goal:** Sever `apps/admin` from `@blog/ui` completely, replacing all 16
imported components across 68 sites with admin-owned primitives built on Base UI
and an admin-specific token layer that matches the design reference exactly.

**Architecture:** Admin gains its own Tailwind token layer (currently it imports
the site's shared theme wholesale, which is why it looks like the public site),
its own icon registry over 13 copied SVGs, and its own `src/components/ui/*`
primitives. Migration is bottom-up — tokens, then icons, then primitives, then
call sites — so the app compiles at every commit. The `@blog/ui` dependency is
removed last, once nothing imports it.

**Tech Stack:** Next.js 16 App Router, Tailwind v4, Base UI (`@base-ui/react`,
already a dependency), `tailwind-variants`, Vitest + Testing Library, SVGR.

**Spec:** [`../specs/2026-08-26-admin-tenant-access-and-add-flow-design.md`](../specs/2026-08-26-admin-tenant-access-and-add-flow-design.md) §8

**Design reference:** [`../../design-reference/admin-tenant-access-mock.html`](../../design-reference/admin-tenant-access-mock.html)
— the authority on every value in Global Constraints below.

**Companion plan:** the route/page work (spec §1–§7) is a separate plan and
depends on this one. Building those surfaces against `@blog/ui` and migrating
afterwards would build each of them twice.

## Global Constraints

- **Token values are copied verbatim from the design reference.** Do not
  re-derive, round, or "improve" them:
  - Surfaces: `--admin-bg:#f6f7f9` · `--admin-surface:#ffffff` · `--admin-surface-2:#fbfbfd`
  - Lines: `--admin-line:#e5e7eb` · `--admin-line-2:#eef0f3`
  - Ink: `--admin-text:#12141a` · `--admin-muted:#5b6472` · `--admin-faint:#8a93a3`
  - Brand: `--admin-brand:#4f46e5` · `--admin-brand-weak:#eef2ff`
  - Tones: `--admin-ok:#16794d` / `--admin-ok-weak:#e7f6ee` · `--admin-warn:#9a6a00` / `--admin-warn-weak:#fbf3df` · `--admin-bad:#b42318` / `--admin-bad-weak:#fdeceb`
  - Sidebar: `--admin-side:#0f1115` · `--admin-side-line:#1c1f26` · `--admin-side-text:#c9cfda` · `--admin-side-raised:#20242e` · `--admin-side-accent:#a5b4fc`
  - Radii: `--admin-radius:12px` · `--admin-radius-sm:8px` · pills `999px`
  - Shadow: `0 1px 2px rgba(16,24,40,.06),0 1px 3px rgba(16,24,40,.08)`
  - Type: Inter for UI, JetBrains Mono for identifiers. Base `14px`, `line-height:1.5`.
- **Admin ships a single light theme.** The sidebar's dark surface is a
  component treatment, not a dark mode. Admin has no theme toggle and no `.dark`
  root class.
- **`look-preview` must keep rendering both light and dark ramps.** It previews
  the _tenant's_ site theme via `build-theme-style-block`, deliberately using the
  site's token vocabulary. Admin's own token layer must not touch it. This is the
  single highest-risk regression in this plan — verify it after Task 1 and again
  at the end.
- **Prefix every admin token `--admin-*`.** They coexist with the tenant preview's
  site tokens in the same document; an unprefixed `--surface` would collide.
- **No new workspace package.** Icons are copied into `apps/admin/src/assets/icons`.
- **Never add anything to `@blog/ui` for admin.** That rule predates this plan
  (`CLAUDE.md`) and this plan is its enforcement.
- **`func-style`:** admin is an arrow-function-const workspace. Components are
  `export const X = (props) => …`, never `export function`.
- **Prop conventions carry over:** booleans take `is`/`has`/`can`/`should`;
  accessible names come from an `ariaLabel` prop, never a hardcoded string;
  `className` is layout-only. Prop types are closed and enumerated — no native
  prop spreading.
- **Every commit must leave `pnpm type-check`, `pnpm lint`, `pnpm test` green.**
  Migration is bottom-up specifically so this holds.

## File Structure

**Created in `apps/admin`:**

| Path                                   | Responsibility                                                                                  |
| -------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/styles/admin-theme.css`           | The `--admin-*` token layer + `@theme inline` mappings. The one place a token value is written. |
| `src/assets/icons/*.svg`               | 13 copied glyphs. Static assets, no logic.                                                      |
| `src/components/ui/icon/`              | `Icon` + `ICON_REGISTRY` over the 13 glyphs.                                                    |
| `src/components/ui/text/`              | `Text` — body/muted/supporting/hint variants.                                                   |
| `src/components/ui/heading/`           | `Heading` — levels 1–4, size variants.                                                          |
| `src/components/ui/button/`            | `Button` — primary/secondary/ghost/danger, sizes.                                               |
| `src/components/ui/link-button/`       | `LinkButton` — polymorphic `as`, shares Button's variants.                                      |
| `src/components/ui/status-badge/`      | `StatusBadge` — rounded pill + tone dot. The component that motivated this work.                |
| `src/components/ui/text-input/`        | `TextInput`, controlled.                                                                        |
| `src/components/ui/textarea/`          | `Textarea`, controlled. Replaces the `@blog/ui` atom being deleted.                             |
| `src/components/ui/segmented-control/` | `SegmentedControl` on Base UI `Toggle Group`.                                                   |
| `src/components/ui/alert/`             | `Alert` — info/warning/error/success.                                                           |
| `src/components/ui/spinner/`           | `Spinner`.                                                                                      |
| `src/components/ui/avatar/`            | `Avatar` — initials.                                                                            |
| `src/components/ui/eyebrow/`           | `Eyebrow`.                                                                                      |
| `src/components/ui/setting-row/`       | `SettingRow` — label/description/control row.                                                   |
| `src/components/ui/brand-mark/`        | `BrandMark` — admin's own sidebar logo.                                                         |
| `src/components/ui/index.ts`           | Barrel. Import sites use `@admin/components/ui/<name>`.                                         |

Each component directory follows the existing admin convention already used by
`src/components/shared/*`: `<name>.tsx`, `<name>-variants.ts`, `<name>.test.tsx`,
`index.ts`.

**Modified:**

| Path                                 | Change                                                                      |
| ------------------------------------ | --------------------------------------------------------------------------- |
| `apps/admin/index.css`               | Import `admin-theme.css`; drop the `@source` scan of `packages/ui`.         |
| `apps/admin/next.config.ts`          | Repoint SVGR at `src/assets/icons`; drop `transpilePackages: ['@blog/ui']`. |
| `apps/admin/vitest.config.ts`        | Drop the `@blog/ui` alias.                                                  |
| `apps/admin/tsconfig.json`           | Drop the `@blog/ui/*` path mapping.                                         |
| `apps/admin/package.json`            | Drop the `@blog/ui` dependency.                                             |
| 68 call sites under `apps/admin/src` | Repoint imports.                                                            |

**Deleted:**

| Path                              | Why                                                                         |
| --------------------------------- | --------------------------------------------------------------------------- |
| `packages/ui/src/atoms/textarea/` | Exactly one consumer repo-wide (admin's `voice-field`); dead on separation. |

---

### Task 1: Admin token layer

**Files:**

- Create: `apps/admin/src/styles/admin-theme.css`
- Modify: `apps/admin/index.css`
- Test: manual visual + `apps/admin/src/components/features/look/look-preview/look-preview.test.tsx` (existing, must stay green)

**Interfaces:**

- Consumes: nothing.
- Produces: Tailwind utilities `bg-admin-surface`, `text-admin-muted`,
  `border-admin-line`, `bg-admin-ok-weak`, `text-admin-ok`, `rounded-admin`,
  `rounded-admin-sm`, `shadow-admin`, and the `--admin-side-*` sidebar tokens.
  Every later task styles exclusively with these.

- [ ] **Step 1: Write the token layer**

Create `apps/admin/src/styles/admin-theme.css`. Values verbatim from Global
Constraints — this file is the only place they appear.

```css
/*
 * apps/admin's own token layer. Admin is a separate deployment with a
 * separate audience: an operator tool, not a reader-facing site. The shared
 * theme's Console preset is deliberately terminal-flavoured, which is wrong
 * here — see the design-system separation spec.
 *
 * Every token is `--admin-*` prefixed because the tenant theme preview
 * renders the SITE's tokens in this same document; an unprefixed
 * `--surface` would collide with it.
 */
:root {
  --admin-bg: #f6f7f9;
  --admin-surface: #ffffff;
  --admin-surface-2: #fbfbfd;
  --admin-line: #e5e7eb;
  --admin-line-2: #eef0f3;
  --admin-text: #12141a;
  --admin-muted: #5b6472;
  --admin-faint: #8a93a3;
  --admin-brand: #4f46e5;
  --admin-brand-weak: #eef2ff;
  --admin-ok: #16794d;
  --admin-ok-weak: #e7f6ee;
  --admin-warn: #9a6a00;
  --admin-warn-weak: #fbf3df;
  --admin-bad: #b42318;
  --admin-bad-weak: #fdeceb;
  --admin-side: #0f1115;
  --admin-side-line: #1c1f26;
  --admin-side-text: #c9cfda;
  --admin-side-raised: #20242e;
  --admin-side-accent: #a5b4fc;
}

@theme inline {
  --color-admin-bg: var(--admin-bg);
  --color-admin-surface: var(--admin-surface);
  --color-admin-surface-2: var(--admin-surface-2);
  --color-admin-line: var(--admin-line);
  --color-admin-line-2: var(--admin-line-2);
  --color-admin-text: var(--admin-text);
  --color-admin-muted: var(--admin-muted);
  --color-admin-faint: var(--admin-faint);
  --color-admin-brand: var(--admin-brand);
  --color-admin-brand-weak: var(--admin-brand-weak);
  --color-admin-ok: var(--admin-ok);
  --color-admin-ok-weak: var(--admin-ok-weak);
  --color-admin-warn: var(--admin-warn);
  --color-admin-warn-weak: var(--admin-warn-weak);
  --color-admin-bad: var(--admin-bad);
  --color-admin-bad-weak: var(--admin-bad-weak);
  --color-admin-side: var(--admin-side);
  --color-admin-side-line: var(--admin-side-line);
  --color-admin-side-text: var(--admin-side-text);
  --color-admin-side-raised: var(--admin-side-raised);
  --color-admin-side-accent: var(--admin-side-accent);

  --radius-admin: 12px;
  --radius-admin-sm: 8px;

  --shadow-admin:
    0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.08);
  --shadow-admin-lg: 0 12px 40px rgba(16, 24, 40, 0.14);
}
```

- [ ] **Step 2: Wire it in**

`apps/admin/index.css` — keep the shared theme import for now (primitives still
come from `@blog/ui` until Task 3+; removing it early breaks the build). The
`@source` scan of `packages/ui` is dropped in Task 11, not here.

```css
@import '@blog/tailwind-config/theme.css';
@import './src/styles/admin-theme.css';

/* Tell Tailwind to scan ui package source for class names */
@source '../../packages/ui/src/**/*.{ts,tsx}';
```

- [ ] **Step 3: Verify the tenant preview is untouched**

Run: `pnpm --filter @blog/admin test look-preview`
Expected: PASS. The preview renders the _tenant's_ site tokens via
`build-theme-style-block`; if this reds, an admin token has collided with a site
token and the prefix is wrong.

- [ ] **Step 4: Verify the app still compiles**

Run: `pnpm type-check && pnpm lint`
Expected: PASS, no change in behaviour — nothing consumes the new tokens yet.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/styles/admin-theme.css apps/admin/index.css
git commit -m "feat(admin): add admin-owned Tailwind token layer"
```

---

### Task 2: Icon assets and registry

**Files:**

- Create: `apps/admin/src/assets/icons/{chevron-right,comment,globe,grid,mail,menu,menu-rows,palette,plus,quote,settings,users,warning}.svg`
- Create: `apps/admin/src/components/ui/icon/{icon.tsx,icon-variants.ts,icon-registry.ts,icon.test.tsx,index.ts}`
- Modify: `apps/admin/next.config.ts` (SVGR include path)

**Interfaces:**

- Consumes: `ICONS`, `TIconName` from `@blog/config` (unchanged — admin keeps
  `@blog/config`).
- Produces: `<Icon name={ICONS.GRID} size="sm" ariaLabel?="…" />`. Decorative by
  default: with no `ariaLabel` it renders `aria-hidden="true"`.

- [ ] **Step 1: Copy the 13 glyphs**

```bash
cd /path/to/repo
mkdir -p apps/admin/src/assets/icons
for i in chevron-right comment globe grid mail menu menu-rows palette plus quote settings users warning; do
  cp "packages/ui/src/assets/icons/$i.svg" "apps/admin/src/assets/icons/$i.svg"
done
ls apps/admin/src/assets/icons | wc -l   # expect 13
```

- [ ] **Step 2: Write the failing test**

`apps/admin/src/components/ui/icon/icon.test.tsx`:

```tsx
import { render, screen } from '@admin/testing/custom-render';
import { ICONS } from '@blog/config';

import { Icon } from './icon';

describe(Icon, () => {
  it('is decorative by default', () => {
    const { container } = render(<Icon name={ICONS.GRID} />);
    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('exposes an accessible name when one is given', () => {
    render(<Icon name={ICONS.WARNING} ariaLabel="Warning" />);
    expect(screen.getByLabelText('Warning')).toBeInTheDocument();
  });

  it('renders every icon admin references without throwing', () => {
    const used = [
      ICONS.CHEVRON_RIGHT,
      ICONS.COMMENT,
      ICONS.GLOBE,
      ICONS.GRID,
      ICONS.MAIL,
      ICONS.MENU,
      ICONS.MENU_ROWS,
      ICONS.PALETTE,
      ICONS.PLUS,
      ICONS.QUOTE,
      ICONS.SETTINGS,
      ICONS.USERS,
      ICONS.WARNING,
    ];
    for (const name of used) {
      expect(() => render(<Icon name={name} />)).not.toThrow();
    }
  });
});
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `pnpm --filter @blog/admin test icon`
Expected: FAIL — `Cannot find module './icon'`.

- [ ] **Step 4: Implement the registry and component**

`icon-registry.ts` maps only the 13 names admin uses. Unlike `@blog/ui`'s
registry it carries no `?url` exports — admin has no consumer for raw URLs.

```ts
import { ICONS, type TIconName } from '@blog/config';
import type { FC, SVGProps } from 'react';

import ChevronRight from '@admin/assets/icons/chevron-right.svg';
import Comment from '@admin/assets/icons/comment.svg';
import Globe from '@admin/assets/icons/globe.svg';
import Grid from '@admin/assets/icons/grid.svg';
import Mail from '@admin/assets/icons/mail.svg';
import Menu from '@admin/assets/icons/menu.svg';
import MenuRows from '@admin/assets/icons/menu-rows.svg';
import Palette from '@admin/assets/icons/palette.svg';
import Plus from '@admin/assets/icons/plus.svg';
import Quote from '@admin/assets/icons/quote.svg';
import Settings from '@admin/assets/icons/settings.svg';
import Users from '@admin/assets/icons/users.svg';
import Warning from '@admin/assets/icons/warning.svg';

type TGlyph = FC<SVGProps<SVGSVGElement>>;

export const ICON_REGISTRY: Partial<Record<TIconName, TGlyph>> = {
  [ICONS.CHEVRON_RIGHT]: ChevronRight,
  [ICONS.COMMENT]: Comment,
  [ICONS.GLOBE]: Globe,
  [ICONS.GRID]: Grid,
  [ICONS.MAIL]: Mail,
  [ICONS.MENU]: Menu,
  [ICONS.MENU_ROWS]: MenuRows,
  [ICONS.PALETTE]: Palette,
  [ICONS.PLUS]: Plus,
  [ICONS.QUOTE]: Quote,
  [ICONS.SETTINGS]: Settings,
  [ICONS.USERS]: Users,
  [ICONS.WARNING]: Warning,
};
```

`icon.tsx`:

```tsx
import type { TIconName } from '@blog/config';

import { ICON_REGISTRY } from './icon-registry';
import { iconVariants, type TIconVariants } from './icon-variants';

export type TIconProps = {
  name: TIconName;
  size?: TIconVariants['size'];
  /** Omit to keep the icon decorative — it then renders `aria-hidden`. */
  ariaLabel?: string;
  className?: string;
};

export const Icon = ({ name, size, ariaLabel, className }: TIconProps) => {
  const Glyph = ICON_REGISTRY[name];

  if (!Glyph) {
    return null;
  }

  return (
    <Glyph
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      className={iconVariants({ size, class: className })}
    />
  );
};
```

- [ ] **Step 5: Repoint SVGR**

In `apps/admin/next.config.ts`, the SVGR rule currently targets `@blog/ui`'s
asset directory. Point it at `apps/admin/src/assets/icons` **in addition** for
now — `@blog/ui`'s registry is still loaded until Task 11.

- [ ] **Step 6: Run the tests**

Run: `pnpm --filter @blog/admin test icon`
Expected: PASS, 3 tests.

- [ ] **Step 7: Commit**

```bash
git add apps/admin/src/assets/icons apps/admin/src/components/ui/icon apps/admin/next.config.ts
git commit -m "feat(admin): add admin-owned icon registry over copied glyphs"
```

---

### Task 3: StatusBadge

The component that motivated the separation. Build it before the rest so the
visual difference is provable early.

**Files:**

- Create: `apps/admin/src/components/ui/status-badge/{status-badge.tsx,status-badge-variants.ts,status-badge.test.tsx,index.ts}`

**Interfaces:**

- Consumes: Task 1's tokens.
- Produces: `<StatusBadge tone="ok" | "warn" | "bad" | "neutral" | "plan">{children}</StatusBadge>`.
  Note `bad` and `plan` are new tones `@blog/ui`'s badge never had — admin needs
  a failure tone and a plan chip.

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@admin/testing/custom-render';

import { StatusBadge } from './status-badge';

describe(StatusBadge, () => {
  it('renders its label', () => {
    render(<StatusBadge tone="ok">Active</StatusBadge>);
    expect(screen.getByText('Active')).toBeVisible();
  });

  it('carries the tone in its classes so the dot inherits it', () => {
    const { container } = render(<StatusBadge tone="bad">Failed</StatusBadge>);
    expect(container.firstChild).toHaveClass('text-admin-bad');
  });

  it('defaults to the neutral tone', () => {
    const { container } = render(<StatusBadge>Draft</StatusBadge>);
    expect(container.firstChild).toHaveClass('text-admin-muted');
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm --filter @blog/admin test status-badge`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`status-badge-variants.ts` — rounded pill, sentence case, Inter. Deliberately
none of `@blog/ui`'s `font-mono uppercase tracking-label rounded-sm`:

```ts
import { tv } from 'tailwind-variants';
import type { VariantProps } from 'tailwind-variants';

export const statusBadgeVariants = tv({
  slots: {
    root: [
      'inline-flex items-center gap-1.5',
      'rounded-full px-2.5 py-0.5',
      'text-[11.5px] font-semibold whitespace-nowrap',
    ],
    dot: 'size-1.5 rounded-full bg-current',
  },
  variants: {
    tone: {
      ok: { root: 'text-admin-ok bg-admin-ok-weak' },
      warn: { root: 'text-admin-warn bg-admin-warn-weak' },
      bad: { root: 'text-admin-bad bg-admin-bad-weak' },
      neutral: { root: 'text-admin-muted bg-admin-line-2' },
      plan: { root: 'text-indigo-800 bg-admin-brand-weak' },
    },
  },
  defaultVariants: { tone: 'neutral' },
});

export type TStatusBadgeVariants = VariantProps<typeof statusBadgeVariants>;
```

`status-badge.tsx`:

```tsx
import {
  statusBadgeVariants,
  type TStatusBadgeVariants,
} from './status-badge-variants';

export type TStatusBadgeProps = {
  tone?: TStatusBadgeVariants['tone'];
  /** The tone dot reads as decoration; suppress it for chips with no state meaning (e.g. a plan name). */
  hasDot?: boolean;
  children: React.ReactNode;
  className?: string;
};

export const StatusBadge = ({
  tone,
  hasDot = true,
  children,
  className,
}: TStatusBadgeProps) => {
  const { root, dot } = statusBadgeVariants({ tone });

  return (
    <span className={root({ class: className })}>
      {hasDot && <span className={dot()} aria-hidden="true" />}
      {children}
    </span>
  );
};
```

- [ ] **Step 4: Run the tests**

Run: `pnpm --filter @blog/admin test status-badge`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/components/ui/status-badge
git commit -m "feat(admin): add admin-owned StatusBadge pill"
```

---

### Tasks 4–9: the remaining primitives

Each follows Task 3's exact shape — failing test, run it, implement with
`tailwind-variants` over Task 1's tokens, run, commit. Build them in this order
so each only depends on what already exists:

| Task  | Component(s)                        | Notes specific to this one                                                                                                                                                                                           |
| ----- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **4** | `Text`, `Heading`, `Eyebrow`        | `Text` variants: `body`/`muted`/`supporting`/`hint`. `Heading` takes `level` 1–4 and a separate `size` — level is semantics, size is appearance, and they must stay independent.                                     |
| **5** | `Button`, `LinkButton`              | Variants `primary`/`secondary`/`ghost`/`danger`, sizes `sm`/`md`. `LinkButton` is polymorphic via `as` (used with next-intl's `Link`) and shares Button's variant file — do not duplicate the class lists.           |
| **6** | `TextInput`, `Textarea`             | Controlled: `value` + `onChange(value: string)`, not a raw event. Both need a `isDisabled` state styled to match the mock's locked-field treatment (`bg-admin-line-2`, `text-admin-faint`).                          |
| **7** | `SegmentedControl`                  | Base UI `Toggle Group`. Generic over the option value type: `SegmentedControl<TTenantPlan>`. Keep the existing `ariaLabel` prop contract — call sites already pass it.                                               |
| **8** | `Alert`, `Spinner`                  | `Alert` tones map to `ALERT_TYPE` from `@blog/config`. `Spinner` keeps `label` + `hasLabel` — the add-tenant overlay asserts on `getByRole('status', { name: 'Creating…' })`.                                        |
| **9** | `Avatar`, `SettingRow`, `BrandMark` | `Avatar` renders initials from a `name`. `BrandMark` is admin's own sidebar mark — it does **not** need `@blog/ui`'s uploaded-image branch or `--logo-*` tokens, which exist for tenant branding on the public site. |

- [ ] **Step 1 (per task): Write the failing test, run it, implement, run, commit**

Follow Task 3 verbatim. Every component gets at least: renders its content, honours
its variant, and honours its disabled/empty state where it has one.

- [ ] **Step 2 (per task): Verify the suite is still green**

Run: `pnpm --filter @blog/admin test`
Expected: PASS. Nothing consumes these yet, so no existing test may change.

---

### Task 10: Migrate the 68 call sites

**Files:**

- Modify: every file under `apps/admin/src` importing `@blog/ui/*`
- Create: `apps/admin/src/components/ui/index.ts`

**Interfaces:**

- Consumes: Tasks 2–9.
- Produces: zero `@blog/ui` imports under `apps/admin/src`.

- [ ] **Step 1: Enumerate the work**

```bash
grep -rl "@blog/ui" apps/admin/src | sort
grep -rho "@blog/ui/[a-z]*/[a-z0-9-]*" apps/admin/src | sort | uniq -c | sort -rn
```

Expected at start: 16 distinct components. Expected at the end of this task: no output.

- [ ] **Step 2: Migrate one component's call sites at a time**

Work component-by-component, not file-by-file — `heading` first (10 sites), then
`button` (9), and so on down the frequency list. After each component:

Run: `pnpm --filter @blog/admin test && pnpm type-check`
Expected: PASS. A component whose migration reds the suite is a prop-contract
mismatch, not a flake — fix the primitive's API, don't loosen the test.

- [ ] **Step 3: Commit per component**

```bash
git commit -m "refactor(admin): migrate Heading call sites to the admin primitive"
```

Twelve or so small commits, each independently revertible, beats one 68-file
commit nobody can review.

- [ ] **Step 4: Confirm nothing is left**

Run: `grep -rn "@blog/ui" apps/admin/src`
Expected: no output.

---

### Task 11: Cut the dependency and delete the dead atom

**Files:**

- Modify: `apps/admin/package.json`, `apps/admin/tsconfig.json`,
  `apps/admin/vitest.config.ts`, `apps/admin/next.config.ts`, `apps/admin/index.css`
- Delete: `packages/ui/src/atoms/textarea/`
- Modify: `packages/ui/COMPONENTS.md` (regenerated, never hand-edited)
- Modify: `SPEC.md`, `CLAUDE.md`, `configs/tailwind/theme.css` header

**Interfaces:**

- Consumes: Task 10 (no importers remain).
- Produces: the layer contract `admin → db, auth, config, utils`.

- [ ] **Step 1: Remove the wiring**

- `package.json` — drop `"@blog/ui": "workspace:*"`.
- `tsconfig.json` — drop the `"@blog/ui/*"` path.
- `vitest.config.ts` — drop the `@blog/ui` alias.
- `next.config.ts` — drop `transpilePackages: ['@blog/ui']` and the `@blog/ui`
  asset branch of the SVGR rule.
- `index.css` — drop the `@source '../../packages/ui/src/**/*.{ts,tsx}'` line.

Then: `pnpm install`

- [ ] **Step 2: Verify the boundary actually holds**

Run: `pnpm type-check && pnpm lint && pnpm --filter @blog/admin test`
Expected: PASS. A leftover import now fails to resolve rather than silently
working — that is the point of removing the alias as well as the dependency.

- [ ] **Step 3: Delete the dead atom**

`Textarea` had exactly one consumer repo-wide, admin's `voice-field`, which
Task 6 replaced.

```bash
grep -rn "atoms/textarea" apps packages --exclude-dir=node_modules   # expect no output
rm -rf packages/ui/src/atoms/textarea
pnpm gen:ui-index
```

Run: `pnpm gen:ui-index:check && pnpm --filter @blog/ui test`
Expected: PASS, and `COMPONENTS.md` no longer lists Textarea.

**Do not delete anything else.** `StatusBadge`, `SegmentedControl`, `SettingRow`,
`Alert`, `Eyebrow` and `BrandMark` all have live `apps/web` or internal
`packages/ui` consumers, verified by reference count. Admin no longer importing
them is not evidence they are unused.

- [ ] **Step 4: Update the governing docs**

These are orchestrator-owned, not layer-agent files:

- `CLAUDE.md` — layer contract line becomes
  `admin → db, auth, config, utils`; the `apps/admin` bullet drops `ui` and
  states admin owns its presentational primitives, not only its interactive ones.
- `SPEC.md` — same contract change, plus the admin token layer.
- `configs/tailwind/theme.css` header — its "only source of Tailwind theme
  tokens" claim gains `apps/admin`'s own layer as a named exception, alongside
  the existing `--code-*` carve-out.
- `docs/context/frontend-conventions.md` — dependency rules.

- [ ] **Step 5: Full verification**

Run: `pnpm type-check && pnpm lint && pnpm test`
Expected: PASS across every workspace.

Then verify by eye against the design reference — the sidebar, a status pill, a
card, and a locked form field. Pixel differences here are bugs in the token
layer, not acceptable drift.

- [ ] **Step 6: Confirm the tenant preview still works**

Run: `pnpm --filter @blog/admin test look-preview`
Expected: PASS. Then load the Look page and confirm the preview still renders
both light and dark tenant ramps — it uses the site's token vocabulary, which
admin no longer imports globally.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(admin): drop the @blog/ui dependency entirely"
```

---

## Self-Review

**Spec coverage.** §8 requires: full separation (Tasks 10–11), 13 copied icons
and no new package (Task 2), an admin token layer (Task 1), `Textarea` deleted
(Task 11 Step 3), nothing else deleted (Task 11 Step 3's explicit guard), and
the layer-contract doc sync (Task 11 Step 4). §1–§7 are the companion plan and
deliberately out of scope here.

**Placeholder scan.** No TBD/TODO. Every code step carries real code; every run
step carries a real command and an expected result. Tasks 4–9 are tabulated
rather than expanded because each is a verbatim repeat of Task 3's five steps
against a different component — the table carries the per-component specifics
that differ, which is the part an executor cannot infer.

**Type consistency.** `Icon` takes `ariaLabel` (not `aria-label`) throughout,
matching the repo's a11y convention and used consistently in Tasks 2 and 4–9.
`StatusBadge`'s tones are `ok`/`warn`/`bad`/`neutral`/`plan` in both the variants
file and the test. `TextInput`/`Textarea` both take `onChange(value: string)`,
matching the existing admin call sites that already pass a value-taking handler.

**Known risk.** Task 1's token prefix is load-bearing: the tenant theme preview
renders site tokens in the same document. It is verified at Task 1 Step 3 and
again at Task 11 Step 6.
