# apps/admin Design-System Separation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Layer ownership:** every file below lives in `apps/admin` or `packages/ui`.
> Per `CLAUDE.md`, those belong to the `admin-app` and `ui` subagents
> respectively — the orchestrator dispatches, it does not hand-author them.
> Only `SPEC.md`, `CLAUDE.md` and `docs/**` are orchestrator-owned.

**Goal:** Give `apps/admin` its own design system — admin-owned primitives on
Base UI plus an admin-specific token layer matching the design reference exactly
— replacing all 16 `@blog/ui` components across 68 sites, save one deliberate
exception: the Look preview's simulated-site sample, which must keep rendering
the _tenant's_ components or the preview stops telling the truth.

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
- **One card treatment, not seventeen.** Admin currently hand-rolls a card
  surface in 17 separate `*-variants.ts` files, using three different radii
  (`rounded-md` x22, `rounded-lg` x7, `rounded-sm` x4) and four different
  paddings. The design reference has exactly one card: `--admin-radius` (12px),
  18px body padding, 14px/18px header padding, hairline `--admin-line-2`
  divider. Every card renders through the `Card` primitive after this plan; no
  page re-declares a surface.
- **No site tokens survive under `apps/admin/src`**, and **no `@blog/ui` imports**
  — outside one allowlisted directory. There are ~165 site-token references today
  (`border-border` x36, `text-text` x27, `bg-surface` x27, ...). The finishing
  checks both exclude
  `apps/admin/src/components/features/look/look-preview/preview-sample/`
  and must otherwise return nothing.
- **`preview-sample/` is the single allowlisted directory.** It renders the
  tenant's site as it will actually look — `WindowChrome`, `BrandMark`, `Text`,
  `Button` from `@blog/ui`. Copying those into admin would produce a second copy
  that drifts from the real site, so the preview would eventually lie. Nothing
  else under `apps/admin` may import `@blog/ui`, and a path-scoped guard enforces
  it — an unenforced exception is how the current 68 sites accumulated.
- **Every commit must leave `pnpm type-check`, `pnpm lint`, `pnpm test` green.**
  Migration is bottom-up specifically so this holds.

## File Structure

**Created in `apps/admin`:**

| Path                                                        | Responsibility                                                                                                     |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `src/styles/admin-theme.css`                                | The `--admin-*` token layer + `@theme inline` mappings. The one place a token value is written.                    |
| `src/assets/icons/*.svg`                                    | 13 copied glyphs. Static assets, no logic.                                                                         |
| `src/components/ui/icon/`                                   | `Icon` + `ICON_REGISTRY` over the 13 glyphs.                                                                       |
| `src/components/ui/text/`                                   | `Text` — body/muted/supporting/hint variants.                                                                      |
| `src/components/ui/heading/`                                | `Heading` — levels 1–4, size variants.                                                                             |
| `src/components/ui/button/`                                 | `Button` — primary/secondary/ghost/danger, sizes.                                                                  |
| `src/components/ui/link-button/`                            | `LinkButton` — polymorphic `as`, shares Button's variants.                                                         |
| `src/components/ui/status-badge/`                           | `StatusBadge` — rounded pill + tone dot. The component that motivated this work.                                   |
| `src/components/ui/text-input/`                             | `TextInput`, controlled.                                                                                           |
| `src/components/ui/textarea/`                               | `Textarea`, controlled. Replaces the `@blog/ui` atom being deleted.                                                |
| `src/components/ui/segmented-control/`                      | `SegmentedControl` on Base UI `Toggle Group`.                                                                      |
| `src/components/ui/alert/`                                  | `Alert` — info/warning/error/success.                                                                              |
| `src/components/ui/spinner/`                                | `Spinner`.                                                                                                         |
| `src/components/ui/avatar/`                                 | `Avatar` — initials.                                                                                               |
| `src/components/ui/eyebrow/`                                | `Eyebrow`.                                                                                                         |
| `src/components/ui/setting-row/`                            | `SettingRow` — label/description/control row.                                                                      |
| `src/components/ui/brand-mark/`                             | `BrandMark` — admin's own sidebar logo.                                                                            |
| `src/components/ui/card/`                                   | `Card` with `Card.Header`/`Card.Body`/`Card.Footer`. Replaces 17 hand-rolled surfaces.                             |
| `src/components/ui/page-header/`                            | `PageHeader` — title, description, badges, actions slot.                                                           |
| `src/components/ui/disclosure/`                             | `Disclosure` — the "Advanced" `<details>` pattern, re-implemented per page today.                                  |
| `src/components/ui/index.ts`                                | Barrel. Import sites use `@admin/components/ui/<name>`.                                                            |
| `src/components/features/look/look-preview/preview-sample/` | The simulated tenant site, extracted from `look-preview.tsx`. **The only directory allowed to import `@blog/ui`.** |

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

### Task 10: Composition primitives

This task is why a 1:1 import swap is not enough. Swapping `Heading` for an
admin-owned `Heading` leaves 17 hand-rolled card surfaces, three radii and four
paddings exactly where they are — the pages would still not match the reference.
These three primitives make conformance mechanical rather than a matter of each
page author remembering.

**Files:**

- Create: `apps/admin/src/components/ui/card/{card.tsx,card-variants.ts,card.test.tsx,index.ts}`
- Create: `apps/admin/src/components/ui/page-header/{page-header.tsx,page-header-variants.ts,page-header.test.tsx,index.ts}`
- Create: `apps/admin/src/components/ui/disclosure/{disclosure.tsx,disclosure-variants.ts,disclosure.test.tsx,index.ts}`

**Interfaces:**

- Consumes: Task 1's tokens, Task 2's `Icon`, Task 4's `Heading`/`Text`.
- Produces:
  - `<Card>` with compound slots `Card.Header`, `Card.Body`, `Card.Footer`.
    `Card.Header` takes `title: string`, optional `description: string`, and
    optional `actions: ReactNode` rendered right-aligned.
  - `<PageHeader title={...} description={...} badges={...} actions={...} />`.
  - `<Disclosure summary={...} isDefaultOpen?={boolean}>{children}</Disclosure>`.

- [ ] **Step 1: Write the failing Card test**

```tsx
import { render, screen } from '@admin/testing/custom-render';

import { Card } from './card';

describe(Card, () => {
  it('renders a titled header with its actions', () => {
    render(
      <Card>
        <Card.Header title="Tenant details" actions={<button>Edit</button>} />
        <Card.Body>body</Card.Body>
      </Card>,
    );
    expect(
      screen.getByRole('heading', { name: 'Tenant details' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeVisible();
    expect(screen.getByText('body')).toBeVisible();
  });

  it('renders without a header', () => {
    render(
      <Card>
        <Card.Body>only a body</Card.Body>
      </Card>,
    );
    expect(screen.getByText('only a body')).toBeVisible();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('applies exactly one radius token to every card', () => {
    const { container } = render(
      <Card>
        <Card.Body>x</Card.Body>
      </Card>,
    );
    expect(container.firstChild).toHaveClass('rounded-admin');
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm --filter @blog/admin test card`
Expected: FAIL — cannot find module `./card`.

- [ ] **Step 3: Implement Card**

`card-variants.ts` is the single source of the card treatment. Values from the
design reference's `.card`, `.card .hd`, `.card .bd`, `.card .ft`:

```ts
import { tv } from 'tailwind-variants';

export const cardVariants = tv({
  slots: {
    root: 'bg-admin-surface border-admin-line rounded-admin shadow-admin border',
    header:
      'border-admin-line-2 flex flex-wrap items-center gap-2.5 border-b px-[18px] py-[14px]',
    title: 'm-0 text-[15px] font-semibold',
    description: 'text-admin-muted text-[12.5px]',
    actions: 'ml-auto flex items-center gap-2',
    body: 'p-[18px]',
    footer:
      'border-admin-line-2 bg-admin-surface-2 rounded-b-admin flex items-center gap-2.5 border-t px-[18px] py-[13px]',
  },
});
```

`card.tsx` uses this repo's compound-slot pattern (`Card.Header`, not a `header`
prop), matching how `@blog/ui` organisms compose so it reads as familiar.

- [ ] **Step 4: Run the Card tests**

Run: `pnpm --filter @blog/admin test card`
Expected: PASS, 3 tests.

- [ ] **Step 5: Repeat the cycle for PageHeader and Disclosure**

Same five steps each. `PageHeader` renders an `h1` through `Heading`, an optional
description, an optional badge row beside the title, and a right-aligned actions
slot — matching `.pagehead` in the reference. `Disclosure` wraps `<details>` with
the reference's `.disclosure` treatment and a rotating chevron via `Icon`,
replacing the `advanced`/`advancedSummary`/`advancedBody` slots that
`voice-settings` and `look-form` each declare separately today.

- [ ] **Step 6: Commit**

```bash
git add apps/admin/src/components/ui/card apps/admin/src/components/ui/page-header apps/admin/src/components/ui/disclosure
git commit -m "feat(admin): add Card, PageHeader and Disclosure composition primitives"
```

---

## The per-surface conformance checklist

Tasks 11–18 each take one admin surface and bring it fully onto admin's own
design system. **Every one of them runs this identical checklist.** It is the
definition of "the design is implemented correctly" for that surface:

1. **Imports.** No `@blog/ui` import remains in the surface's files.
2. **Tokens.** No site token (`bg-surface`, `text-text*`, `border-border*`,
   `ring-brand-primary`, `bg-primary`, `border-brand-primary`) remains. Only
   `*-admin-*` utilities.
3. **Surfaces.** Every card-like box renders through `Card`. The surface's own
   `*-variants.ts` declares **no** `rounded-*` on a panel, no `bg-admin-surface`
   box, no `border border-admin-line` box. Layout-only classes — flex, grid,
   gap, max-width — stay.
4. **Page header.** If the surface is a page, its title/description/actions
   render through `PageHeader`, not hand-rolled `Heading` + `<p>`.
5. **Disclosure.** Any `<details>`/advanced section renders through `Disclosure`.
6. **Visual diff.** Open the page beside its governing reference section and
   compare radius, padding, hairline colour, type scale, badge shape, button
   weight and focus ring. Differences are bugs in the surface, not acceptable
   drift.
7. **Tests.** The surface's existing tests pass unchanged. If a test asserted on
   a `@blog/ui` class name, rewrite that assertion against behaviour or role —
   never delete it.
8. **Commit** as `refactor(admin): bring <surface> onto admin's design system`.

**Governing reference per surface** — the authority when two disagree:

| Surface                                                 | Reference                                                              |
| ------------------------------------------------------- | ---------------------------------------------------------------------- |
| Shell, tenants list, Look, Voice, Features              | `docs/design-reference/admin-panel-mock.html` (+ its correction brief) |
| Overview, provisioning, danger, owner dashboard, domain | `docs/design-reference/admin-tenant-access-mock.html`                  |
| Add-tenant wizard                                       | `admin-panel-mock.html:404-422` (step rail + `Add tenant` H1)          |

Where a surface has no reference (`/unauthorized`, `/dashboard/select-tenant`),
checklist items 1–5 still apply and item 6 is satisfied by matching the nearest
analogous surface's treatment.

---

### Task 11: The shell

**Files:** `src/components/features/layout/{admin-shell,sidebar,topbar,tenant-switcher}/**`

Do the shell first — every page renders inside it, so a shell still on site
tokens makes every later visual diff unreadable.

**Surface specifics:**

- The sidebar uses `--admin-side*` tokens, not the generic surface tokens. It is
  intentionally dark; that is a component treatment, not a dark theme.
- `Topbar` takes `crumb: string` today. **Leave that contract alone** — real
  breadcrumbs are the companion plan's work. Restyle only.
- `TenantSwitcher` is restyled, not removed. Its removal from the platform tree
  is the companion plan's routing change.
- `TopbarNavMenu` is already Base UI `Menu`; only its classes change.

- [ ] Run all 8 checklist items above.

---

### Task 12: Tenants list

**Files:** `src/components/features/tenants/{tenants-view,tenants-table,archived-tenants-toggle}/**`

**Surface specifics:**

- The table's header row, hairlines and row hover come from the reference's
  `table.tt` block, not from a card body's padding.
- Plan and status chips use Task 3's `StatusBadge`. The plan chip is
  `tone="plan" hasDot={false}` — a plan is not a state, so it takes no tone dot.
- `TenantsView`'s description renders `t.rich` with a `<code>` chunk. Keep the
  rich-text call; restyle the `code` treatment.

- [ ] Run all 8 checklist items above.

---

### Task 13: Look

**Files:** `src/components/features/look/{look-page-content,look-form,look-preview,brand-asset-field,logo-hue-field}/**`, `src/components/shared/{preset-picker,font-picker,hue-slider}/**`

The largest surface, and the one carrying the highest-risk component.

**Surface specifics:**

- **`look-preview` is exempt from checklist item 2.** It renders the _tenant's_
  site theme via `build-theme-style-block` and must keep the site token
  vocabulary inside the preview frame. Only the panel chrome around it moves to
  admin tokens. Getting this wrong silently breaks the live preview, which is the
  entire point of the Look page.
- `look-form` declares its own card slots and an advanced-section disclosure;
  both move to `Card` and `Disclosure`.
- `PresetPicker`, `FontPicker` and `HueSlider` keep their behaviour and prop
  contracts exactly; only classes change.
- The correction brief's §1–§7 govern this page's _content_ — OKLCH ramps,
  `RADIUS_SCALE` labels, two densities, five fonts, the `chromeOn` toggle.
  Verify each is still correctly implemented while you are in here, and **report
  any that are not rather than fixing them silently** — those are content bugs,
  not styling, and they need their own ticket.

- [ ] Run all 8 checklist items above.
- [ ] **Extra step: verify the preview survived.**
      Run: `pnpm --filter @blog/admin test look-preview` — Expected: PASS.
      Then load the page and confirm the preview still renders both light and dark
      tenant ramps, and that `chromeOn` still produces the terminal frame.
- [ ] **Extra step: confirm the exception is exactly one directory.**
      Run: `grep -rln "@blog/ui" apps/admin/src/components/features/look`
      Expected: only paths under `look-preview/preview-sample/`.

---

### Task 14: Voice

**Files:** `src/components/features/voice/{voice-page-content,voice-settings,voice-field-group,voice-field}/**`

**Surface specifics:**

- `voice-settings-variants.ts` is the clearest instance of the problem this plan
  exists to fix: it declares `basicCard` at `rounded-md` and `advanced` at
  `rounded-lg` in the same file. Both become `Card`.
- The advanced section becomes `Disclosure`.
- `voice-field` renders a `Textarea` — repoint it at Task 6's admin primitive.
  This is the **last consumer of `@blog/ui`'s `Textarea` anywhere in the repo**,
  so finishing this task is what makes Task 19's deletion safe.
- Each field is an **override**: empty means "inherit from the preset's voice
  pack". The inherited value must stay visible as a placeholder, and clearing a
  field must still read as "revert to preset". Verify that survives restyling —
  it is carried by placeholder styling, which is easy to flatten by accident.

- [ ] Run all 8 checklist items above.

---

### Task 15: Features

**Files:** `src/components/features/capabilities/{features-page-content,features-settings}/**`

**Surface specifics:**

- Uses `SettingRow` (Task 9's admin version). The label/description/control
  rhythm must match the reference, not `@blog/ui`'s account-page spacing.
- Capability rows disabled by plan entitlement get the same locked treatment as a
  locked tenant-details field: `bg-admin-line-2`, `text-admin-faint`, reason text
  beside them. Consistency between "locked by plan" and "locked by provisioning"
  is deliberate — both mean "you cannot change this right now, and here is why."

- [ ] Run all 8 checklist items above.

---

### Task 16: Add-tenant wizard

**Files:** `src/components/features/tenants/tenant-details-form/**`

**Surface specifics:**

- **Restyle only.** The wizard chrome (`Add tenant` H1, six-step rail) and the
  copy fixes belong to the companion plan; doing them here would mix a visual
  migration with a behavioural change in one commit.
- The full-form pending overlay must keep `role="status"` with its label — an
  existing test asserts `getByRole('status', { name: 'Creating…' })`.

- [ ] Run all 8 checklist items above.

---

### Task 17: Provisioning, tenant details panel, danger zone

**Files:** `src/components/features/tenants/{provisioning-status-view,tenant-details-panel,tenant-status-view,deprovision-tenant-control}/**`

**Surface specifics:**

- The step rail's indicator circles, connectors and tone colours come from
  `admin-tenant-access-mock.html`'s `.step` block.
- **The details panel's four-state lock model is behaviour, not styling. Do not
  touch `computeTenantFieldLocks` or the panel's lock logic.** Restyle the locked
  field treatment only: disabled input on `bg-admin-line-2`, reason text at
  `text-admin-faint` beside it. A `FAILED` run must still leave the field that
  caused the failure editable.
- `ConfirmDialog` (Base UI) in `deprovision-tenant-control` is restyled here.

- [ ] Run all 8 checklist items above.
- [ ] **Extra step: verify the lock matrix is unchanged.**
      Run: `pnpm --filter @blog/admin test tenant-details-panel tenant-field-locks`
      Expected: PASS, with no test edits.

---

### Task 18: Owner dashboard and remaining pages

**Files:** `src/components/features/layout/dashboard-tenant-picker/**`, `src/app/[locale]/unauthorized/page.tsx`, `src/app/[locale]/(platform)/page.tsx`, `src/components/shared/{form-field,confirm-dialog}/**`

**Surface specifics:**

- `/unauthorized` is currently bare `<main><h1><p>` with no styling at all. It
  renders **outside** `AdminShell`, so it cannot inherit the shell background —
  give it a self-contained centred treatment.
- `FormField` is admin's existing shared field wrapper. Align its label, hint,
  error and footer slots to the reference's `.field` block; it becomes the single
  field treatment every admin form uses.

- [ ] Run all 8 checklist items above.

**Deliberately not covered by any task:**
`src/components/features/tenants/tenant-overview/` — the `/t/{slug}` landing
stub. The companion plan **deletes** it along with the whole slug tree, so
restyling it is wasted work. If you reach it and the companion plan has not run
yet, leave it exactly as it is; it will still be importing `@blog/ui`, and Task
19 Step 1's grep will flag it. That flag is expected, and it is the signal that
the two plans have to land in order — not a reason to restyle the file.

---

### Task 19: Confine the dependency, add the guard, delete the dead atom

**Files:**

- Modify: `apps/admin/package.json`, `apps/admin/tsconfig.json`,
  `apps/admin/vitest.config.ts`, `apps/admin/next.config.ts`, `apps/admin/index.css`
- Delete: `packages/ui/src/atoms/textarea/`
- Modify: `packages/ui/COMPONENTS.md` (regenerated, never hand-edited)
- Modify: `SPEC.md`, `CLAUDE.md`, `configs/tailwind/theme.css` header,
  `docs/context/frontend-conventions.md`

**Interfaces:**

- Consumes: Tasks 11–18 (no importers remain).
- Produces: the layer contract `admin → db, auth, config, utils`.

- [ ] **Step 1: Confirm the only remaining reach is the allowlisted directory**

```bash
grep -rln "@blog/ui" apps/admin/src | grep -v "look-preview/preview-sample/"
grep -rnE "(text|bg|border|ring)-(text|surface|border|primary|brand)" apps/admin/src | grep -v "look-preview/preview-sample/"
```

Expected: no output from either. Anything else printed is a surface that was
missed, not a second exception.

- [ ] **Step 2: Add the path-scoped guard**

The dependency **stays** — `preview-sample/` imports it, so `package.json`, the
`tsconfig` path, the vitest alias, `transpilePackages` and the shared-theme
import all remain. Removing them is not the goal; confining the reach is.

An unenforced exception is exactly how 68 import sites accumulated, so add an
ESLint rule in `configs/eslint/` restricting `@blog/ui` imports under
`apps/admin` to `look-preview/preview-sample/` — `no-restricted-imports` with a
`files` override for the allowlisted path. Remember `files` globs resolve against
the consuming workspace, not the repo root; verify with `eslint --print-config`
on a file inside and a file outside the directory.

Add a comment on the retained `index.css` theme import naming the reason, so the
next reader does not "clean it up".

- [ ] **Step 3: Verify the boundary holds**

Run: `pnpm type-check && pnpm lint && pnpm --filter @blog/admin test`
Expected: PASS. Then prove the guard bites: add a throwaway `@blog/ui` import to
an admin file outside `preview-sample/`, re-run `pnpm lint`, confirm it errors,
and remove it. A guard nobody has seen fail is not known to work.

- [ ] **Step 4: Delete the dead atom**

```bash
grep -rn "atoms/textarea" apps packages --exclude-dir=node_modules
rm -rf packages/ui/src/atoms/textarea
pnpm gen:ui-index
```

The grep must print nothing before you delete.

Run: `pnpm gen:ui-index:check && pnpm --filter @blog/ui test`
Expected: PASS, and `COMPONENTS.md` no longer lists Textarea.

**Do not delete anything else.** `StatusBadge`, `SegmentedControl`, `SettingRow`,
`Alert`, `Eyebrow` and `BrandMark` all have live `apps/web` or internal
`packages/ui` consumers, verified by reference count. Admin no longer importing
them is not evidence they are unused.

- [ ] **Step 5: Update the governing docs**

Orchestrator-owned files, not layer-agent ones:

- `CLAUDE.md` — contract becomes `admin → db, auth, config, utils`; the
  `apps/admin` bullet drops `ui` and states admin owns its presentational
  primitives, not only its interactive ones.
- `SPEC.md` — the same contract change, plus the admin token layer.
- `configs/tailwind/theme.css` header — its "only source of Tailwind theme
  tokens" claim gains `apps/admin`'s layer as a named exception, alongside the
  existing `--code-*` carve-out.
- `docs/context/frontend-conventions.md` — dependency rules.

- [ ] **Step 6: Full verification**

Run: `pnpm type-check && pnpm lint && pnpm test`
Expected: PASS across every workspace.

- [ ] **Step 7: Whole-app visual pass**

Walk every admin surface against its governing reference: shell, tenants list,
add-tenant, tenant overview, provisioning, danger, Look, Voice, Features, owner
dashboard, select-tenant, unauthorized. Confirm one radius, one card treatment,
one field treatment and one badge shape throughout.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor(admin): drop the @blog/ui dependency entirely"
```

---

## Self-Review

**Spec coverage.** §8 requires full separation (Tasks 11–19), 13 copied icons and
no new package (Task 2), an admin token layer (Task 1), `Textarea` deleted (Task
19 Step 4), nothing else deleted (Task 19 Step 4's explicit guard), and the
layer-contract doc sync (Task 19 Step 5). Spec §1–§7 are the companion plan and
deliberately out of scope — Tasks 11 and 16 both name where a behavioural change
belongs instead.

**Surface coverage.** Every admin surface has an owning task: shell (11), tenants
list (12), Look (13), Voice (14), Features (15), add-tenant (16), provisioning /
details panel / danger zone (17), owner dashboard / unauthorized / platform root /
shared field + dialog (18). Exactly one directory is deliberately excluded —
`tenant-overview`, which the companion plan deletes — and Task 18 says so
explicitly rather than leaving it silently unclaimed. Nothing else under
`apps/admin/src/components` is unaccounted for; verified by enumerating every
component directory against this plan.

**Placeholder scan.** No TBD/TODO. Every code step carries real code; every run
step carries a real command and an expected result. Tasks 11–18 reference one
fully-specified checklist rather than restating it eight times, and each carries
its own specifics for what differs — the part an executor cannot infer.

**Type consistency.** `Icon` takes `ariaLabel` throughout (Tasks 2, 4–10).
`StatusBadge`'s tones are `ok`/`warn`/`bad`/`neutral`/`plan` in the variants file,
its test and Task 12's usage; `hasDot` is the documented opt-out and Task 12 uses
exactly that name. `Card`'s slots are `Card.Header`/`Card.Body`/`Card.Footer` in
Task 10 and referenced by those names throughout Tasks 11–18.
`TextInput`/`Textarea` both take `onChange(value: string)`.

**Known risks.**

1. Task 1's token prefix is load-bearing — the tenant preview renders site tokens
   in the same document. Verified at Task 1 Step 3, Task 13, and Task 19 Step 1.
2. `preview-sample/` is the one directory exempt from BOTH the no-`@blog/ui` and
   no-site-tokens rules, because it reproduces the tenant's site rather than
   admin's own chrome. Tasks 13 and 19 both call it out. A mechanical sweep that
   ignores it breaks the live preview; an exception left unenforced re-grows into
   the app, which is how the current 68 sites happened.
3. Task 14 gates Task 19's deletion — `voice-field` is the last `Textarea`
   consumer in the repo.
