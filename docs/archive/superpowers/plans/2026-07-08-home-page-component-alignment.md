# Home Page Component Alignment Plan

> **Archived — implemented.** See SPEC.md §1. Product summary (Home surface) for current behavior.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align every UI component used by the Home page with the Console design spec (`docs/design-reference/home-page-component-spec.md`) and `docs/design-reference/design-reference.html` — adding missing atoms/molecules/organisms, fixing token/variant gaps, refactoring ThemeToggle to be pure, and updating the web layer to compose everything correctly. Post Detail components are identified but deferred.

**Architecture:** `@blog/ui` is pure and prop-driven (no `'use client'`); client-side state lives only in `apps/web`. Compound components (`mapCompoundSlots`) are the composition pattern for organisms/molecules. All conditional styling uses `tv()` from `tailwind-variants` — no `cn()`.

**Tech Stack:** Next.js 15, React 19 Server Components, Tailwind v4, `tailwind-variants`, Vitest + Testing Library, Sanity (data only — not touched here)

## Global Constraints

- All new/updated `@blog/ui` files: no `'use client'` directive — client components belong in `apps/web` only
- All variant styling: `tv()` from `tailwind-variants`; never `cn()`
- Semantic tokens only: `bg-bg`, `text-text`, `text-muted`, `text-subtle`, `border-border`, `bg-accent`, etc. (shorter form — `text-muted` not `text-text-muted`)
- Motion: `motion-reduce:transition-none motion-reduce:transform-none` on animated components
- Accessibility: interactive elements have visible focus state; icon-only buttons have `aria-label`; card links use full-overlay pattern (`before:absolute before:inset-0`)
- Tests: co-located `*.test.tsx` files; run with `pnpm --filter @blog/ui test`
- Responsive: mobile-first; `sm:` for 2-col card grids and footer row; `lg:` for hero media split
- No page-level margins in atoms — organisms/templates own placement

---

## Complete Component Inventory

### Atoms

| Component                   | Status      | Scope                    | Notes                                                                                                        |
| --------------------------- | ----------- | ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `Logo`                      | **Missing** | Home                     | `HeaderBrand` is a generic `<span>` — no two-part suffix accent                                              |
| `NavLink`                   | **Fix**     | Home                     | `duration-fast` → `duration-base`; `text-text-subtle` → `text-subtle`; missing `no-underline`, `ring-offset` |
| `IconButton`                | **Missing** | Home                     | `ThemeToggle` bundles client logic with styling; need pure primitive                                         |
| `Eyebrow`                   | **Missing** | Home                     | Style is baked into `heroVariants.eyebrow` — not a reusable atom                                             |
| `Heading`                   | **Fix**     | Home                     | `font-bold` → `font-medium`; needs semantic variant API (`hero`/`post`/`card`/`section`)                     |
| `Text` (BodyText/MutedText) | **Missing** | Home                     | No serif body-copy atom with `lead`/`muted`/`hero`/`card` variants                                           |
| `Button`                    | **Fix**     | Home                     | `duration-fast` → `duration-base`; missing `border` in base; missing `ring-offset`; ghost hover wrong        |
| `Tag`                       | ✅ Exists   | Both                     | `tag/` — variants: `default`, `accent` — aligned with spec                                                   |
| `ProseLink`                 | **Missing** | Post Detail _(deferred)_ | Inline anchor with accent underline — used in article body                                                   |
| `InlineCode`                | **Missing** | Post Detail _(deferred)_ | Mono inline code span — used in article body                                                                 |
| `MediaFrame`                | **Missing** | Home                     | Reusable image container for hero and cover images                                                           |
| `Caption`                   | **Missing** | Home                     | `<figcaption>` mono style for optional images                                                                |
| `MetaSeparator` (Separator) | **Missing** | Home                     | `·` dot separator used in metadata rows                                                                      |

### Molecules

| Component           | Status                         | Scope                    | Notes                                                                                         |
| ------------------- | ------------------------------ | ------------------------ | --------------------------------------------------------------------------------------------- |
| `PrimaryNavigation` | **Missing**                    | Home                     | NavLink + IconButton in a flex nav — currently composed inline in `layout.tsx`                |
| `SiteHeader`        | ✅ Exists as `Header` organism | Home                     | Existing `Header` compound component covers this; minor token fix needed                      |
| `PostMeta`          | **Missing**                    | Post Detail _(deferred)_ | Article date · readTime · words · category — full-width border top/bottom                     |
| `CardMeta`          | **Missing**                    | Home                     | Compact date · readingTime · category for post cards                                          |
| `PostCard`          | **Fix/Restructure**            | Home                     | Wrong padding tokens; `h2` → `h3`; missing CardMeta at top; no full-card link overlay         |
| `TagList`           | **Missing**                    | Home                     | Wraps `Tag` atoms with flex + gap — currently inlined everywhere                              |
| `ActionList`        | **Missing**                    | Home                     | Button group for hero CTA — `HeroCta` slot does this but isn't a standalone reusable molecule |
| `CodeBlock`         | **Missing**                    | Post Detail _(deferred)_ | Code container with filename label and `overflow-x-auto`                                      |
| `QuoteBlock`        | **Missing**                    | Post Detail _(deferred)_ | Blockquote with accent-muted left rule                                                        |
| `ImageWithCaption`  | **Missing**                    | Home                     | `MediaFrame` + `Caption` in a `<figure>` — used for hero image and post covers                |

### Organisms

| Component       | Status                | Scope                    | Notes                                                                                 |
| --------------- | --------------------- | ------------------------ | ------------------------------------------------------------------------------------- |
| `HomeHero`      | ✅ Exists as `Hero`   | Home                     | Breakpoint `md:` → `lg:`; should compose `Eyebrow`/`Text` atoms                       |
| `LatestPosts`   | **Missing**           | Home                     | Spec wants a dedicated organism; currently split across `ContentSection` + `PostGrid` |
| `ArticleHeader` | **Missing**           | Post Detail _(deferred)_ | Eyebrow, post title, PostMeta, lead, optional cover image                             |
| `ArticleBody`   | **Missing**           | Post Detail _(deferred)_ | Prose container: Text, ProseLink, InlineCode, CodeBlock, QuoteBlock, TagList          |
| `SiteFooter`    | ✅ Exists as `Footer` | Home                     | Existing `Footer` compound component covers this                                      |

### Templates / Routes (in `apps/web`, not `@blog/ui`)

| Component          | Status      | Scope                    | Notes                                                               |
| ------------------ | ----------- | ------------------------ | ------------------------------------------------------------------- |
| `HomePageTemplate` | **Missing** | Home                     | Placement shell: `SiteHeader → HomeHero → LatestPosts → SiteFooter` |
| `PostPageTemplate` | **Missing** | Post Detail _(deferred)_ | Narrower reading-column shell                                       |

---

## Summary: Home Page Scope Only

**New atoms to create:** `Logo`, `Eyebrow`, `Text`, `MetaSeparator`, `IconButton`, `MediaFrame`, `Caption`

**New molecules to create:** `CardMeta`, `PrimaryNavigation`, `TagList`, `ActionList`, `ImageWithCaption`

**New organisms to create:** `LatestPosts`

**New web templates to create:** `HomePageTemplate` (in `apps/web`)

**Existing components to fix:** `NavLink`, `Button`, `Heading`, `ThemeToggle`, `PostCard`, `Hero`

**Dead code to remove:** `packages/ui/src/utils/cn.ts`

**Deferred (Post Detail):** `ProseLink`, `InlineCode`, `PostMeta`, `CodeBlock`, `QuoteBlock`, `ImageWithCaption` (partial), `ArticleHeader`, `ArticleBody`, `PostPageTemplate`

---

## Task 1: New atoms — Logo, Eyebrow, MetaSeparator

**Files:**

- Create: `packages/ui/src/atoms/logo/logo-variants.ts`
- Create: `packages/ui/src/atoms/logo/logo.tsx`
- Create: `packages/ui/src/atoms/logo/logo.test.tsx`
- Create: `packages/ui/src/atoms/logo/index.ts`
- Create: `packages/ui/src/atoms/eyebrow/eyebrow-variants.ts`
- Create: `packages/ui/src/atoms/eyebrow/eyebrow.tsx`
- Create: `packages/ui/src/atoms/eyebrow/eyebrow.test.tsx`
- Create: `packages/ui/src/atoms/eyebrow/index.ts`
- Create: `packages/ui/src/atoms/meta-separator/meta-separator-variants.ts`
- Create: `packages/ui/src/atoms/meta-separator/meta-separator.tsx`
- Create: `packages/ui/src/atoms/meta-separator/meta-separator.test.tsx`
- Create: `packages/ui/src/atoms/meta-separator/index.ts`

**Interfaces:**

- `Logo` produces: `<Logo prefix="val" suffix=".dev" />` — used by `layout.tsx` in Task 11
- `Eyebrow` produces: `<Eyebrow>{children}</Eyebrow>` — used by `Hero` in Task 9 and `LatestPosts` in Task 10
- `MetaSeparator` produces: `<MetaSeparator />` — used by `CardMeta` in Task 6 and `ActionList` in Task 8

- [ ] **Step 1: Write failing tests**

```tsx
// packages/ui/src/atoms/logo/logo.test.tsx
import { render, screen } from '@testing-library/react';
import { Logo } from './logo';

describe('<Logo />', () => {
  it('renders prefix text', () => {
    render(<Logo prefix="val" suffix=".dev" />);
    expect(screen.getByText('val')).toBeVisible();
  });

  it('renders suffix with accent style', () => {
    render(<Logo prefix="val" suffix=".dev" />);
    expect(screen.getByText('.dev').className).toContain('text-accent');
  });

  it('renders without suffix', () => {
    render(<Logo prefix="console" />);
    expect(screen.getByText('console')).toBeVisible();
  });

  it('accepts className override', () => {
    const { container } = render(<Logo prefix="val" className="extra" />);
    expect(container.firstChild).toHaveClass('extra');
  });
});

// packages/ui/src/atoms/eyebrow/eyebrow.test.tsx
import { render, screen } from '@testing-library/react';
import { Eyebrow } from './eyebrow';

describe('<Eyebrow />', () => {
  it('renders children', () => {
    render(<Eyebrow>Architecture</Eyebrow>);
    expect(screen.getByText('Architecture')).toBeVisible();
  });

  it('applies accent color', () => {
    render(<Eyebrow>Architecture</Eyebrow>);
    expect(screen.getByText('Architecture').className).toContain('text-accent');
  });

  it('accepts className override', () => {
    render(<Eyebrow className="mt-2">Architecture</Eyebrow>);
    expect(screen.getByText('Architecture').className).toContain('mt-2');
  });
});

// packages/ui/src/atoms/meta-separator/meta-separator.test.tsx
import { render } from '@testing-library/react';
import { MetaSeparator } from './meta-separator';

describe('<MetaSeparator />', () => {
  it('renders the separator character', () => {
    const { container } = render(<MetaSeparator />);
    expect(container.textContent).toBe('·');
  });

  it('is aria-hidden', () => {
    const { container } = render(<MetaSeparator />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pnpm --filter @blog/ui test -- logo eyebrow meta-separator
```

Expected: FAIL (modules not found)

- [ ] **Step 3: Create Logo**

```ts
// packages/ui/src/atoms/logo/logo-variants.ts
import { tv } from 'tailwind-variants';

export const logoVariants = tv({
  slots: {
    root: 'inline-flex items-baseline whitespace-nowrap font-display text-[19px] font-medium tracking-[-0.01em] text-text',
    suffix: 'font-mono text-sm font-normal text-accent',
  },
});
```

```tsx
// packages/ui/src/atoms/logo/logo.tsx
import type { HTMLAttributes } from 'react';
import { logoVariants } from './logo-variants';

export interface ILogoProps extends HTMLAttributes<HTMLSpanElement> {
  prefix: string;
  suffix?: string;
}

export const Logo = ({ prefix, suffix, className, ...rest }: ILogoProps) => {
  const { root, suffix: suffixClass } = logoVariants();
  return (
    <span className={root({ class: className })} {...rest}>
      {prefix}
      {suffix && <span className={suffixClass()}>{suffix}</span>}
    </span>
  );
};
```

```ts
// packages/ui/src/atoms/logo/index.ts
export * from './logo';
```

- [ ] **Step 4: Create Eyebrow**

```ts
// packages/ui/src/atoms/eyebrow/eyebrow-variants.ts
import { tv } from 'tailwind-variants';

export const eyebrowVariants = tv({
  base: 'font-mono text-label font-medium uppercase tracking-eyebrow text-accent',
});
```

```tsx
// packages/ui/src/atoms/eyebrow/eyebrow.tsx
import type { HTMLAttributes } from 'react';
import { eyebrowVariants } from './eyebrow-variants';

export const Eyebrow = ({
  className,
  ...rest
}: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={eyebrowVariants({ class: className })} {...rest} />
);
```

```ts
// packages/ui/src/atoms/eyebrow/index.ts
export * from './eyebrow';
```

- [ ] **Step 5: Create MetaSeparator**

```ts
// packages/ui/src/atoms/meta-separator/meta-separator-variants.ts
import { tv } from 'tailwind-variants';

export const metaSeparatorVariants = tv({
  base: 'mx-[7px] text-border-strong',
});
```

```tsx
// packages/ui/src/atoms/meta-separator/meta-separator.tsx
import { metaSeparatorVariants } from './meta-separator-variants';

export const MetaSeparator = () => (
  <span aria-hidden="true" className={metaSeparatorVariants()}>
    ·
  </span>
);
```

```ts
// packages/ui/src/atoms/meta-separator/index.ts
export * from './meta-separator';
```

- [ ] **Step 6: Run tests**

```bash
pnpm --filter @blog/ui test -- logo eyebrow meta-separator
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/atoms/logo packages/ui/src/atoms/eyebrow packages/ui/src/atoms/meta-separator
git commit -m "feat(ui): add Logo, Eyebrow, MetaSeparator atoms"
```

---

## Task 2: New atom — Text (serif body copy)

**Files:**

- Create: `packages/ui/src/atoms/text/text-variants.ts`
- Create: `packages/ui/src/atoms/text/text.tsx`
- Create: `packages/ui/src/atoms/text/text.test.tsx`
- Create: `packages/ui/src/atoms/text/index.ts`

**Interfaces:**

- Produces: `<Text variant="hero|muted|lead|card">{children}</Text>` — used by `Hero` in Task 9

- [ ] **Step 1: Write failing tests**

```tsx
// packages/ui/src/atoms/text/text.test.tsx
import { render, screen } from '@testing-library/react';
import { Text } from './text';

describe('<Text />', () => {
  it('renders children as a paragraph', () => {
    render(<Text>Body text</Text>);
    expect(screen.getByText('Body text').tagName).toBe('P');
  });

  it('hero variant applies muted color', () => {
    render(<Text variant="hero">Subtitle</Text>);
    expect(screen.getByText('Subtitle').className).toContain('text-muted');
  });

  it('card variant applies card-copy size', () => {
    render(<Text variant="card">Excerpt</Text>);
    expect(screen.getByText('Excerpt').className).toContain('text-card-copy');
  });

  it('accepts className override', () => {
    render(<Text className="max-w-prose">Body</Text>);
    expect(screen.getByText('Body').className).toContain('max-w-prose');
  });
});
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
pnpm --filter @blog/ui test -- text
```

- [ ] **Step 3: Implement**

```ts
// packages/ui/src/atoms/text/text-variants.ts
import { tv } from 'tailwind-variants';

export const textVariants = tv({
  base: 'font-read',
  variants: {
    variant: {
      lead: 'text-lead leading-[1.72] text-text',
      muted: 'text-lead leading-[1.72] text-muted',
      hero: 'text-base leading-[1.6] text-muted',
      card: 'text-card-copy leading-[1.55] text-muted',
    },
  },
  defaultVariants: { variant: 'lead' },
});
```

```tsx
// packages/ui/src/atoms/text/text.tsx
import type { HTMLAttributes } from 'react';
import type { VariantProps } from 'tailwind-variants';
import { textVariants } from './text-variants';

export type TTextProps = HTMLAttributes<HTMLParagraphElement> &
  VariantProps<typeof textVariants>;

export const Text = ({ variant, className, ...rest }: TTextProps) => (
  <p className={textVariants({ variant, class: className })} {...rest} />
);
```

```ts
// packages/ui/src/atoms/text/index.ts
export * from './text';
```

- [ ] **Step 4: Run to confirm PASS**

```bash
pnpm --filter @blog/ui test -- text
```

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/atoms/text
git commit -m "feat(ui): add Text atom with lead/muted/hero/card variants"
```

---

## Task 3: New atoms — MediaFrame, Caption

**Files:**

- Create: `packages/ui/src/atoms/media-frame/media-frame-variants.ts`
- Create: `packages/ui/src/atoms/media-frame/media-frame.tsx`
- Create: `packages/ui/src/atoms/media-frame/media-frame.test.tsx`
- Create: `packages/ui/src/atoms/media-frame/index.ts`
- Create: `packages/ui/src/atoms/caption/caption-variants.ts`
- Create: `packages/ui/src/atoms/caption/caption.tsx`
- Create: `packages/ui/src/atoms/caption/caption.test.tsx`
- Create: `packages/ui/src/atoms/caption/index.ts`

**Interfaces:**

- `MediaFrame` produces: `<MediaFrame className="aspect-[4/3] min-h-[170px]">{children}</MediaFrame>` — a styled container; caller passes `<Image fill />` inside
- `Caption` produces: `<Caption>Optional cover image.</Caption>` — used by `ImageWithCaption` in Task 7

- [ ] **Step 1: Write failing tests**

```tsx
// packages/ui/src/atoms/media-frame/media-frame.test.tsx
import { render, screen } from '@testing-library/react';
import { MediaFrame } from './media-frame';

describe('<MediaFrame />', () => {
  it('renders children', () => {
    render(
      <MediaFrame>
        <img src="/img.jpg" alt="test" />
      </MediaFrame>,
    );
    expect(screen.getByRole('img')).toBeVisible();
  });

  it('has relative positioning for fill images', () => {
    const { container } = render(<MediaFrame />);
    expect(container.firstChild).toHaveClass('relative');
  });

  it('accepts className for aspect-ratio override', () => {
    const { container } = render(<MediaFrame className="aspect-video" />);
    expect(container.firstChild).toHaveClass('aspect-video');
  });
});

// packages/ui/src/atoms/caption/caption.test.tsx
import { render, screen } from '@testing-library/react';
import { Caption } from './caption';

describe('<Caption />', () => {
  it('renders children as figcaption', () => {
    render(<Caption>Image description</Caption>);
    expect(screen.getByText('Image description').tagName).toBe('FIGCAPTION');
  });

  it('applies mono font', () => {
    render(<Caption>Text</Caption>);
    expect(screen.getByText('Text').className).toContain('font-mono');
  });
});
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
pnpm --filter @blog/ui test -- media-frame caption
```

- [ ] **Step 3: Implement MediaFrame**

```ts
// packages/ui/src/atoms/media-frame/media-frame-variants.ts
import { tv } from 'tailwind-variants';

export const mediaFrameVariants = tv({
  base: [
    'relative isolate overflow-hidden',
    'rounded-lg border border-border bg-surface-2',
  ],
});
```

```tsx
// packages/ui/src/atoms/media-frame/media-frame.tsx
import type { HTMLAttributes } from 'react';
import { mediaFrameVariants } from './media-frame-variants';

export const MediaFrame = ({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) => (
  <div className={mediaFrameVariants({ class: className })} {...rest}>
    {children}
  </div>
);
```

```ts
// packages/ui/src/atoms/media-frame/index.ts
export * from './media-frame';
```

- [ ] **Step 4: Implement Caption**

```ts
// packages/ui/src/atoms/caption/caption-variants.ts
import { tv } from 'tailwind-variants';

export const captionVariants = tv({
  base: 'mt-2 font-mono text-label text-subtle leading-[1.5]',
});
```

```tsx
// packages/ui/src/atoms/caption/caption.tsx
import type { HTMLAttributes } from 'react';
import { captionVariants } from './caption-variants';

export const Caption = ({
  className,
  ...rest
}: HTMLAttributes<HTMLElement>) => (
  <figcaption className={captionVariants({ class: className })} {...rest} />
);
```

```ts
// packages/ui/src/atoms/caption/index.ts
export * from './caption';
```

- [ ] **Step 5: Run to confirm PASS**

```bash
pnpm --filter @blog/ui test -- media-frame caption
```

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/atoms/media-frame packages/ui/src/atoms/caption
git commit -m "feat(ui): add MediaFrame and Caption atoms"
```

---

## Task 4: New atom — IconButton (pure, no client)

**Files:**

- Create: `packages/ui/src/atoms/icon-button/icon-button-variants.ts`
- Create: `packages/ui/src/atoms/icon-button/icon-button.tsx`
- Create: `packages/ui/src/atoms/icon-button/icon-button.test.tsx`
- Create: `packages/ui/src/atoms/icon-button/index.ts`

**Interfaces:**

- Produces: `<IconButton ariaLabel="...">{icon}</IconButton>` — used by `ThemeToggleButton` wrapper in `apps/web` (Task 12) and `PrimaryNavigation` in Task 6

- [ ] **Step 1: Write failing tests**

```tsx
// packages/ui/src/atoms/icon-button/icon-button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IconButton } from './icon-button';

describe('<IconButton />', () => {
  it('renders as a button with aria-label', () => {
    render(
      <IconButton ariaLabel="Toggle theme">
        <span>icon</span>
      </IconButton>,
    );
    expect(screen.getByRole('button', { name: 'Toggle theme' })).toBeVisible();
  });

  it('applies 22×22 size class', () => {
    render(
      <IconButton ariaLabel="test">
        <span />
      </IconButton>,
    );
    expect(screen.getByRole('button').className).toContain('size-[22px]');
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(
      <IconButton ariaLabel="click" onClick={onClick}>
        <span />
      </IconButton>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('accepts className override', () => {
    render(
      <IconButton ariaLabel="test" className="extra">
        <span />
      </IconButton>,
    );
    expect(screen.getByRole('button').className).toContain('extra');
  });
});
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
pnpm --filter @blog/ui test -- icon-button
```

- [ ] **Step 3: Implement**

```ts
// packages/ui/src/atoms/icon-button/icon-button-variants.ts
import { tv } from 'tailwind-variants';

export const iconButtonVariants = tv({
  base: [
    'inline-grid size-[22px] place-items-center',
    'rounded-sm border border-transparent bg-transparent p-0',
    'text-muted transition-colors duration-base ease-console',
    'hover:text-text',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
  ],
});
```

```tsx
// packages/ui/src/atoms/icon-button/icon-button.tsx
import type { ButtonHTMLAttributes } from 'react';
import { iconButtonVariants } from './icon-button-variants';

interface IIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ariaLabel: string;
}

export const IconButton = ({
  ariaLabel,
  className,
  children,
  ...rest
}: IIconButtonProps) => (
  <button
    type="button"
    aria-label={ariaLabel}
    className={iconButtonVariants({ class: className })}
    {...rest}
  >
    {children}
  </button>
);
```

```ts
// packages/ui/src/atoms/icon-button/index.ts
export * from './icon-button';
```

- [ ] **Step 4: Run to confirm PASS, commit**

```bash
pnpm --filter @blog/ui test -- icon-button
git add packages/ui/src/atoms/icon-button
git commit -m "feat(ui): add IconButton atom (pure, no client)"
```

---

## Task 5: Update existing atoms — NavLink, Button, Heading

**Files:**

- Modify: `packages/ui/src/atoms/nav-link/nav-link-variants.ts`
- Modify: `packages/ui/src/atoms/nav-link/nav-link.test.tsx`
- Modify: `packages/ui/src/atoms/button/button-variants.ts`
- Modify: `packages/ui/src/atoms/heading/heading-variants.ts`
- Modify: `packages/ui/src/atoms/heading/heading.tsx`
- Modify: `packages/ui/src/atoms/heading/heading.test.tsx`

**Interfaces:**

- `Heading` gains additive `visual` prop: `hero | post | card | section`. Old `level` (1–4) and `size` props kept.

- [ ] **Step 1: Update NavLink variants**

Replace `packages/ui/src/atoms/nav-link/nav-link-variants.ts`:

```ts
import { tv } from 'tailwind-variants';

export const navLinkVariants = tv({
  base: [
    'inline-flex no-underline',
    'font-mono text-meta',
    'transition-colors duration-base ease-console',
    'hover:text-text',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
  ],
  variants: {
    isActive: {
      true: 'text-accent',
      false: 'text-subtle',
    },
  },
  defaultVariants: { isActive: false },
});
```

- [ ] **Step 2: Update NavLink test — change `text-text-subtle` to `text-subtle`**

In `packages/ui/src/atoms/nav-link/nav-link.test.tsx` line ~28:

```tsx
// Before:
expect(screen.getByRole('link', { name: 'Blog' }).className).toContain(
  'text-text-subtle',
);
// After:
expect(screen.getByRole('link', { name: 'Blog' }).className).toContain(
  'text-subtle',
);
```

- [ ] **Step 3: Update Button variants**

Replace `packages/ui/src/atoms/button/button-variants.ts`:

```ts
import { tv } from 'tailwind-variants';

export const buttonVariants = tv({
  base: [
    'inline-flex min-h-9 items-center justify-center',
    'rounded-sm border',
    'font-display font-medium',
    'transition-colors duration-base ease-console',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  variants: {
    variant: {
      primary:
        'border-transparent bg-accent text-accent-contrast hover:bg-accent-hover',
      ghost:
        'border-border-strong bg-transparent text-text hover:border-accent hover:text-accent',
      link: 'border-transparent bg-transparent px-1 text-accent underline underline-offset-[3px] hover:text-accent-hover',
    },
    size: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-copy',
      lg: 'px-5 py-2.5 text-base',
    },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
});
```

> Check `packages/config/src/constants/size.ts` — if `Size.SM === 'sm'` etc., update any `Size.SM` references in `button.test.tsx` to plain strings.

- [ ] **Step 4: Add `visual` variant to Heading (additive)**

Replace `packages/ui/src/atoms/heading/heading-variants.ts`:

```ts
import { tv } from 'tailwind-variants';

export const headingVariants = tv({
  base: ['font-display font-medium text-text'],
  variants: {
    visual: {
      hero: 'text-hero leading-[1.05] tracking-tight-hero',
      post: 'text-post-title leading-[1.07] tracking-tight-display',
      card: 'text-card-title leading-[1.2] tracking-tight-card',
      section: 'text-title-2xl leading-[1.2] tracking-tight-display',
    },
    size: {
      xs: 'text-lg leading-tight tracking-tight',
      sm: 'text-xl leading-tight tracking-tight',
      md: 'text-2xl leading-tight tracking-tight',
      lg: 'text-3xl leading-tight tracking-tight',
      xl: 'text-4xl leading-tight tracking-tight',
      xxl: 'text-display leading-[1.05] tracking-tight',
    },
  },
});
```

Update `packages/ui/src/atoms/heading/heading.tsx`:

```tsx
import type { HTMLAttributes } from 'react';
import type { VariantProps } from 'tailwind-variants';
import { headingVariants } from './heading-variants';

export type THeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  level: 1 | 2 | 3 | 4;
  visual?: VariantProps<typeof headingVariants>['visual'];
  size?: VariantProps<typeof headingVariants>['size'];
};

type TSize = NonNullable<VariantProps<typeof headingVariants>['size']>;

const defaultSizes: Record<1 | 2 | 3 | 4, TSize> = {
  1: 'xxl',
  2: 'xl',
  3: 'lg',
  4: 'md',
};

export const Heading = ({
  level,
  visual,
  size,
  className,
  ...rest
}: THeadingProps) => {
  const Tag = `h${level}` as const;
  return (
    <Tag
      className={headingVariants({
        visual,
        size: visual ? undefined : (size ?? defaultSizes[level]),
        class: className,
      })}
      {...rest}
    />
  );
};
```

- [ ] **Step 5: Update Heading tests — remove old Size enum, add visual variant tests**

In `packages/ui/src/atoms/heading/heading.test.tsx`, update the size-override test:

```tsx
// Old: import { Size } from '@blog/config';
// New: remove that import — use plain strings

it('applies size override', () => {
  render(
    <Heading level={1} size="sm">
      Small
    </Heading>,
  );
  expect(
    screen.getByRole('heading', { level: 1, name: 'Small' }).className,
  ).toContain('text-xl');
});

// Add:
it('applies visual variant hero', () => {
  render(
    <Heading level={1} visual="hero">
      Hero
    </Heading>,
  );
  expect(
    screen.getByRole('heading', { level: 1, name: 'Hero' }).className,
  ).toContain('text-hero');
});

it('visual variant skips default size class', () => {
  render(
    <Heading level={1} visual="card">
      Card
    </Heading>,
  );
  const cls = screen.getByRole('heading', { level: 1, name: 'Card' }).className;
  expect(cls).toContain('text-card-title');
  expect(cls).not.toContain('text-display');
});
```

- [ ] **Step 6: Run all updated atom tests**

```bash
pnpm --filter @blog/ui test -- nav-link button heading
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/atoms/nav-link packages/ui/src/atoms/button packages/ui/src/atoms/heading
git commit -m "fix(ui): align NavLink/Button/Heading tokens with spec"
```

---

## Task 6: New molecules — CardMeta, TagList, ActionList

**Files:**

- Create: `packages/ui/src/molecules/card-meta/card-meta-variants.ts`
- Create: `packages/ui/src/molecules/card-meta/card-meta.tsx`
- Create: `packages/ui/src/molecules/card-meta/card-meta.test.tsx`
- Create: `packages/ui/src/molecules/card-meta/index.ts`
- Create: `packages/ui/src/molecules/tag-list/tag-list-variants.ts`
- Create: `packages/ui/src/molecules/tag-list/tag-list.tsx`
- Create: `packages/ui/src/molecules/tag-list/tag-list.test.tsx`
- Create: `packages/ui/src/molecules/tag-list/index.ts`
- Create: `packages/ui/src/molecules/action-list/action-list-variants.ts`
- Create: `packages/ui/src/molecules/action-list/action-list.tsx`
- Create: `packages/ui/src/molecules/action-list/action-list.test.tsx`
- Create: `packages/ui/src/molecules/action-list/index.ts`

**Interfaces:**

- `CardMeta` consumes `MetaSeparator` from Task 1; produces `<CardMeta dateIso dateLabel readingTime? category />`
- `TagList` wraps `Tag` atoms; produces `<TagList tags={string[]} />`
- `ActionList` is a flex container; produces `<ActionList>{buttons}</ActionList>` — used by `HomeHero` in Task 9

- [ ] **Step 1: Write failing tests**

```tsx
// packages/ui/src/molecules/card-meta/card-meta.test.tsx
import { render, screen } from '@testing-library/react';
import { CardMeta } from './card-meta';

describe('<CardMeta />', () => {
  it('renders date as time element', () => {
    render(
      <CardMeta
        dateIso="2026-06-28"
        dateLabel="2026-06-28"
        category="architecture"
      />,
    );
    expect(screen.getByRole('time')).toHaveAttribute('dateTime', '2026-06-28');
  });

  it('renders reading time when provided', () => {
    render(
      <CardMeta
        dateIso="2026-06-28"
        dateLabel="2026-06-28"
        readingTime="9 min"
        category="arch"
      />,
    );
    expect(screen.getByText('9 min')).toBeVisible();
  });

  it('renders category in uppercase', () => {
    render(
      <CardMeta
        dateIso="2026-06-28"
        dateLabel="2026-06-28"
        category="design"
      />,
    );
    expect(screen.getByText('DESIGN')).toBeVisible();
  });

  it('applies accent color to category', () => {
    render(
      <CardMeta
        dateIso="2026-06-28"
        dateLabel="2026-06-28"
        category="design"
      />,
    );
    expect(screen.getByText('DESIGN').className).toContain('text-accent');
  });

  it('omits reading time separators when readingTime not provided', () => {
    render(
      <CardMeta
        dateIso="2026-06-28"
        dateLabel="2026-06-28"
        category="design"
      />,
    );
    // One separator between date and category — not two
    const separators = document.querySelectorAll('[aria-hidden="true"]');
    expect(separators).toHaveLength(1);
  });
});

// packages/ui/src/molecules/tag-list/tag-list.test.tsx
import { render, screen } from '@testing-library/react';
import { TagList } from './tag-list';

describe('<TagList />', () => {
  it('renders all tags', () => {
    render(<TagList tags={['react', 'typescript']} />);
    expect(screen.getByText('react')).toBeVisible();
    expect(screen.getByText('typescript')).toBeVisible();
  });

  it('renders nothing when tags is empty', () => {
    const { container } = render(<TagList tags={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('accepts className override', () => {
    const { container } = render(<TagList tags={['a']} className="mt-4" />);
    expect(container.firstChild).toHaveClass('mt-4');
  });
});

// packages/ui/src/molecules/action-list/action-list.test.tsx
import { render, screen } from '@testing-library/react';
import { ActionList } from './action-list';

describe('<ActionList />', () => {
  it('renders children', () => {
    render(
      <ActionList>
        <button>Read</button>
      </ActionList>,
    );
    expect(screen.getByRole('button', { name: 'Read' })).toBeVisible();
  });

  it('accepts className override', () => {
    const { container } = render(
      <ActionList className="extra">
        <span />
      </ActionList>,
    );
    expect(container.firstChild).toHaveClass('extra');
  });
});
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
pnpm --filter @blog/ui test -- card-meta tag-list action-list
```

- [ ] **Step 3: Implement CardMeta**

```ts
// packages/ui/src/molecules/card-meta/card-meta-variants.ts
import { tv } from 'tailwind-variants';

export const cardMetaVariants = tv({
  slots: {
    root: 'mb-1.5 flex flex-wrap items-center gap-y-1 font-mono text-label text-subtle',
    category: 'text-accent',
  },
});
```

```tsx
// packages/ui/src/molecules/card-meta/card-meta.tsx
import { MetaSeparator } from '@blog/ui/atoms/meta-separator';
import { cardMetaVariants } from './card-meta-variants';

export interface ICardMetaProps {
  dateIso: string;
  dateLabel: string;
  readingTime?: string;
  category: string;
}

export const CardMeta = ({
  dateIso,
  dateLabel,
  readingTime,
  category,
}: ICardMetaProps) => {
  const { root, category: categoryClass } = cardMetaVariants();
  return (
    <div className={root()}>
      <time dateTime={dateIso}>{dateLabel}</time>
      {readingTime && (
        <>
          <MetaSeparator />
          <span>{readingTime}</span>
        </>
      )}
      <MetaSeparator />
      <span className={categoryClass()}>{category.toUpperCase()}</span>
    </div>
  );
};
```

```ts
// packages/ui/src/molecules/card-meta/index.ts
export * from './card-meta';
```

- [ ] **Step 4: Implement TagList**

```ts
// packages/ui/src/molecules/tag-list/tag-list-variants.ts
import { tv } from 'tailwind-variants';

export const tagListVariants = tv({
  base: 'mt-4 flex flex-wrap gap-2',
});
```

```tsx
// packages/ui/src/molecules/tag-list/tag-list.tsx
import type { HTMLAttributes } from 'react';
import { Tag } from '@blog/ui/atoms/tag';
import { tagListVariants } from './tag-list-variants';

interface ITagListProps extends HTMLAttributes<HTMLDivElement> {
  tags: string[];
}

export const TagList = ({ tags, className, ...rest }: ITagListProps) => {
  if (tags.length === 0) return null;
  return (
    <div className={tagListVariants({ class: className })} {...rest}>
      {tags.map((tag) => (
        <Tag key={tag}>{tag}</Tag>
      ))}
    </div>
  );
};
```

```ts
// packages/ui/src/molecules/tag-list/index.ts
export * from './tag-list';
```

- [ ] **Step 5: Implement ActionList**

```ts
// packages/ui/src/molecules/action-list/action-list-variants.ts
import { tv } from 'tailwind-variants';

export const actionListVariants = tv({
  base: 'mt-[18px] flex flex-wrap items-center gap-3',
});
```

```tsx
// packages/ui/src/molecules/action-list/action-list.tsx
import type { HTMLAttributes } from 'react';
import { actionListVariants } from './action-list-variants';

export const ActionList = ({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) => (
  <div className={actionListVariants({ class: className })} {...rest} />
);
```

```ts
// packages/ui/src/molecules/action-list/index.ts
export * from './action-list';
```

- [ ] **Step 6: Run to confirm PASS**

```bash
pnpm --filter @blog/ui test -- card-meta tag-list action-list
```

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/molecules/card-meta packages/ui/src/molecules/tag-list packages/ui/src/molecules/action-list
git commit -m "feat(ui): add CardMeta, TagList, ActionList molecules"
```

---

## Task 7: New molecule — ImageWithCaption

**Files:**

- Create: `packages/ui/src/molecules/image-with-caption/image-with-caption-variants.ts`
- Create: `packages/ui/src/molecules/image-with-caption/image-with-caption.tsx`
- Create: `packages/ui/src/molecules/image-with-caption/image-with-caption.test.tsx`
- Create: `packages/ui/src/molecules/image-with-caption/index.ts`

**Interfaces:**

- Consumes: `MediaFrame` from Task 3, `Caption` from Task 3
- Produces: `<ImageWithCaption caption="..." className="aspect-[4/3]">{<Image fill />}</ImageWithCaption>`

- [ ] **Step 1: Write failing tests**

```tsx
// packages/ui/src/molecules/image-with-caption/image-with-caption.test.tsx
import { render, screen } from '@testing-library/react';
import { ImageWithCaption } from './image-with-caption';

describe('<ImageWithCaption />', () => {
  it('renders children inside the frame', () => {
    render(
      <ImageWithCaption caption="Alt text">
        <img src="/img.jpg" alt="photo" />
      </ImageWithCaption>,
    );
    expect(screen.getByRole('img', { name: 'photo' })).toBeVisible();
  });

  it('renders the caption', () => {
    render(
      <ImageWithCaption caption="A caption">
        <img src="/img.jpg" alt="" />
      </ImageWithCaption>,
    );
    expect(screen.getByText('A caption')).toBeVisible();
  });

  it('renders as a figure element', () => {
    const { container } = render(
      <ImageWithCaption caption="x">
        <span />
      </ImageWithCaption>,
    );
    expect(container.firstChild?.nodeName).toBe('FIGURE');
  });

  it('omits figcaption when caption is empty string', () => {
    render(
      <ImageWithCaption caption="">
        <img src="/img.jpg" alt="" />
      </ImageWithCaption>,
    );
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
pnpm --filter @blog/ui test -- image-with-caption
```

- [ ] **Step 3: Implement**

```ts
// packages/ui/src/molecules/image-with-caption/image-with-caption-variants.ts
import { tv } from 'tailwind-variants';

export const imageWithCaptionVariants = tv({
  slots: {
    figure: 'my-[18px]',
  },
});
```

```tsx
// packages/ui/src/molecules/image-with-caption/image-with-caption.tsx
import type { HTMLAttributes } from 'react';
import { Caption } from '@blog/ui/atoms/caption';
import { MediaFrame } from '@blog/ui/atoms/media-frame';
import { imageWithCaptionVariants } from './image-with-caption-variants';

interface IImageWithCaptionProps extends HTMLAttributes<HTMLElement> {
  caption: string;
}

export const ImageWithCaption = ({
  caption,
  className,
  children,
  ...rest
}: IImageWithCaptionProps) => {
  const { figure } = imageWithCaptionVariants();
  return (
    <figure className={figure({ class: className })} {...rest}>
      <MediaFrame>{children}</MediaFrame>
      {caption && <Caption>{caption}</Caption>}
    </figure>
  );
};
```

```ts
// packages/ui/src/molecules/image-with-caption/index.ts
export * from './image-with-caption';
```

- [ ] **Step 4: Run to confirm PASS, commit**

```bash
pnpm --filter @blog/ui test -- image-with-caption
git add packages/ui/src/molecules/image-with-caption
git commit -m "feat(ui): add ImageWithCaption molecule"
```

---

## Task 8: New molecule — PrimaryNavigation

**Files:**

- Create: `packages/ui/src/molecules/primary-navigation/primary-navigation-variants.ts`
- Create: `packages/ui/src/molecules/primary-navigation/primary-navigation.tsx`
- Create: `packages/ui/src/molecules/primary-navigation/primary-navigation.test.tsx`
- Create: `packages/ui/src/molecules/primary-navigation/index.ts`

**Why:** The spec's `PrimaryNavigation` is a reusable `<nav>` composing NavLink items. Currently the nav is assembled inline in `apps/web/layout.tsx`.

**Interfaces:**

- Produces: `<PrimaryNavigation links={[{href, label}]} actions={<ThemeToggleButton />} />`
- Used by `layout.tsx` in Task 12 to replace the inline nav

- [ ] **Step 1: Write failing tests**

```tsx
// packages/ui/src/molecules/primary-navigation/primary-navigation.test.tsx
import { render, screen } from '@testing-library/react';
import { PrimaryNavigation } from './primary-navigation';

describe('<PrimaryNavigation />', () => {
  const links = [
    { href: '/writing', label: 'writing' },
    { href: '/about', label: 'about' },
  ];

  it('renders all nav links', () => {
    render(<PrimaryNavigation links={links} />);
    expect(screen.getByRole('link', { name: 'writing' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'about' })).toBeVisible();
  });

  it('renders as nav landmark', () => {
    render(<PrimaryNavigation links={links} />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders actions slot when provided', () => {
    render(
      <PrimaryNavigation links={links} actions={<button>Toggle</button>} />,
    );
    expect(screen.getByRole('button', { name: 'Toggle' })).toBeVisible();
  });

  it('renders without actions', () => {
    render(<PrimaryNavigation links={links} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
pnpm --filter @blog/ui test -- primary-navigation
```

- [ ] **Step 3: Implement**

```ts
// packages/ui/src/molecules/primary-navigation/primary-navigation-variants.ts
import { tv } from 'tailwind-variants';

export const primaryNavigationVariants = tv({
  base: 'flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2',
});
```

```tsx
// packages/ui/src/molecules/primary-navigation/primary-navigation.tsx
import type { ReactNode } from 'react';
import { NavLink } from '@blog/ui/atoms/nav-link';
import { primaryNavigationVariants } from './primary-navigation-variants';

interface INavItem {
  href: string;
  label: string;
  isActive?: boolean;
}

interface IPrimaryNavigationProps {
  links: INavItem[];
  actions?: ReactNode;
  ariaLabel?: string;
}

export const PrimaryNavigation = ({
  links,
  actions,
  ariaLabel = 'Primary',
}: IPrimaryNavigationProps) => (
  <nav aria-label={ariaLabel} className={primaryNavigationVariants()}>
    {links.map((link) => (
      <NavLink key={link.href} href={link.href} isActive={link.isActive}>
        {link.label}
      </NavLink>
    ))}
    {actions}
  </nav>
);
```

```ts
// packages/ui/src/molecules/primary-navigation/index.ts
export * from './primary-navigation';
```

- [ ] **Step 4: Run to confirm PASS, commit**

```bash
pnpm --filter @blog/ui test -- primary-navigation
git add packages/ui/src/molecules/primary-navigation
git commit -m "feat(ui): add PrimaryNavigation molecule"
```

---

## Task 9: Update organisms — Hero (breakpoint + atom composition) + PostCard restructure

**Files:**

- Modify: `packages/ui/src/organisms/hero/hero-variants.ts`
- Modify: `packages/ui/src/organisms/hero/hero.tsx`
- Modify: `packages/ui/src/molecules/post-card/post-card-variants.ts`
- Modify: `packages/ui/src/molecules/post-card/post-card.tsx`
- Modify: `packages/ui/src/molecules/post-card/components/title/post-card-title.tsx`
- Modify: `packages/ui/src/molecules/post-card/post-card.test.tsx`

- [ ] **Step 1: Fix Hero breakpoint and compose atoms**

Replace `packages/ui/src/organisms/hero/hero-variants.ts`:

```ts
import { tv } from 'tailwind-variants';

export const heroVariants = tv({
  slots: {
    root: [
      'grid grid-cols-1 items-center',
      'gap-[clamp(1.25rem,4vw,2rem)] py-[26px] pb-2',
    ],
    content: ['min-w-0'],
    meta: ['mt-2 font-mono text-meta text-subtle'],
    title: ['mt-2.5 mb-3 max-w-[16ch]'],
    tags: ['mt-4 flex flex-wrap gap-2'],
  },
  variants: {
    hasMedia: {
      true: { root: 'lg:grid-cols-[minmax(0,1.15fr)_minmax(180px,0.85fr)]' },
    },
  },
});
```

Update `packages/ui/src/organisms/hero/hero.tsx` to use `<Eyebrow>`, `<Text variant="hero">`, and `<Heading level={1} visual="hero">`:

```tsx
import type { IWithDataTestId } from '@blog/config';
import { Eyebrow } from '@blog/ui/atoms/eyebrow';
import { Heading } from '@blog/ui/atoms/heading';
import { Tag } from '@blog/ui/atoms/tag';
import { Text } from '@blog/ui/atoms/text';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@blog/ui/lib/compound';
import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { Fragment } from 'react';

import { HeroCta } from './components/cta/hero-cta';
import { HeroMedia } from './components/media/hero-media';
import { heroVariants } from './hero-variants';

const HeroParts = {
  Media: HeroMedia,
  Cta: HeroCta,
} satisfies Record<string, ElementType>;

export interface IHeroProps
  extends
    Omit<ComponentPropsWithoutRef<'section'>, 'children'>,
    IWithDataTestId {
  title: string;
  eyebrow?: string;
  excerpt?: string;
  tags?: string[];
  publishedAt?: string;
  formattedDate?: string;
  children?: TCompoundChildren<typeof HeroParts>;
  ariaLabel?: string;
}

const HeroRoot = ({
  title,
  eyebrow,
  excerpt,
  tags,
  publishedAt,
  formattedDate,
  children,
  className,
  dataTestId,
  ariaLabel,
  ...rest
}: IHeroProps) => {
  const { slots, unmatched } = mapCompoundSlots(children, HeroParts);
  const s = heroVariants({ hasMedia: Boolean(slots.Media) });

  return (
    <section
      aria-label={ariaLabel}
      className={s.root({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      <div className={s.content()}>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        {publishedAt && formattedDate && (
          <time dateTime={publishedAt} className={s.meta()}>
            {formattedDate}
          </time>
        )}
        <div className={s.title()}>
          <Heading level={1} visual="hero">
            {title}
          </Heading>
        </div>
        {excerpt && (
          <Text variant="hero" className="m-0 max-w-[52ch]">
            {excerpt}
          </Text>
        )}
        {tags && tags.length > 0 && (
          <div className={s.tags()}>
            {tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        )}
        {slots.Cta}
        {unmatched.map((node, i) => (
          <Fragment key={i}>{node}</Fragment>
        ))}
      </div>
      {slots.Media}
    </section>
  );
};

export const Hero: TCompoundComponent<typeof HeroRoot, typeof HeroParts> =
  Object.assign(HeroRoot, HeroParts);
```

- [ ] **Step 2: Restructure PostCard — add Meta slot, h3 title, card padding**

Replace `packages/ui/src/molecules/post-card/post-card-variants.ts`:

```ts
import { tv } from 'tailwind-variants';

export const postCardVariants = tv({
  slots: {
    root: [
      'relative rounded-md border border-border bg-surface',
      'px-card-x py-card-y',
      'transition-[transform,border-color] duration-base ease-console',
      'hover:-translate-y-0.5 hover:border-border-strong',
      'focus-within:-translate-y-0.5 focus-within:border-border-strong',
      'motion-reduce:transition-none motion-reduce:transform-none',
    ],
    content: ['flex flex-col gap-1'],
    excerpt: ['text-sm leading-[1.55] text-muted line-clamp-3'],
    meta: [
      'flex items-center gap-2 mt-auto pt-3 border-t border-border font-mono text-xs text-subtle',
    ],
    tags: ['flex flex-wrap gap-1.5 mt-1'],
  },
});
```

Update `packages/ui/src/molecules/post-card/components/title/post-card-title.tsx` — change `h2` → `h3`:

```tsx
import type { ComponentPropsWithoutRef } from 'react';
import { postCardTitleVariants } from './post-card-title-variants';

export const PostCardTitle = ({
  className,
  ...rest
}: ComponentPropsWithoutRef<'h3'>) => (
  <h3 className={postCardTitleVariants({ class: className })} {...rest} />
);
```

Add `CardMeta` as a compound slot in `packages/ui/src/molecules/post-card/post-card.tsx`. Import `CardMeta` and add `Meta: CardMeta` to `PostCardParts`. Render `{slots.Meta}` before `{slots.Title}` in the content div.

Full replacement for `post-card.tsx`:

```tsx
import { type IWithDataTestId, Size } from '@blog/config';
import { Avatar } from '@blog/ui/atoms/avatar';
import { Tag } from '@blog/ui/atoms/tag';
import { CardMeta } from '@blog/ui/molecules/card-meta';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@blog/ui/lib/compound';
import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { Fragment } from 'react';

import { PostCardMedia } from './components/media/post-card-media';
import { PostCardTitle } from './components/title/post-card-title';
import { postCardVariants } from './post-card-variants';

const PostCardParts = {
  Media: PostCardMedia,
  Title: PostCardTitle,
  Meta: CardMeta,
} satisfies Record<string, ElementType>;

const s = postCardVariants();

export interface IPostCardProps
  extends
    Omit<ComponentPropsWithoutRef<'article'>, 'children'>,
    IWithDataTestId {
  excerpt?: string;
  tags?: string[];
  publishedAt?: string;
  formattedDate?: string;
  authorName?: string;
  authorAvatarSrc?: string;
  children?: TCompoundChildren<typeof PostCardParts>;
}

const PostCardRoot = ({
  excerpt,
  tags,
  publishedAt,
  formattedDate,
  authorName,
  authorAvatarSrc,
  children,
  className,
  dataTestId,
  ...rest
}: IPostCardProps) => {
  const { slots, unmatched } = mapCompoundSlots(children, PostCardParts);

  return (
    <article
      className={s.root({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      {slots.Media}
      <div className={s.content()}>
        {slots.Meta}
        {slots.Title}
        {unmatched.map((node, i) => (
          <Fragment key={i}>{node}</Fragment>
        ))}
        {tags && tags.length > 0 && (
          <div className={s.tags()}>
            {tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        )}
        {excerpt && <p className={s.excerpt()}>{excerpt}</p>}
        {(publishedAt || authorName) && (
          <div className={s.meta()}>
            {authorName && (
              <Avatar
                name={authorName}
                alt={authorName}
                src={authorAvatarSrc}
                size={Size.SM}
              />
            )}
            {authorName && <span>{authorName}</span>}
            {publishedAt && formattedDate && (
              <time dateTime={publishedAt}>{formattedDate}</time>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export const PostCard: TCompoundComponent<
  typeof PostCardRoot,
  typeof PostCardParts
> = Object.assign(PostCardRoot, PostCardParts);
```

- [ ] **Step 3: Update PostCard test — title is now h3**

In `packages/ui/src/molecules/post-card/post-card.test.tsx`:

```tsx
// Before:
expect(screen.getByRole('heading', { level: 2 })).toBeVisible();
// After:
expect(screen.getByRole('heading', { level: 3 })).toBeVisible();
```

- [ ] **Step 4: Run organism/molecule tests**

```bash
pnpm --filter @blog/ui test -- hero post-card
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/organisms/hero packages/ui/src/molecules/post-card
git commit -m "fix(ui): Hero lg: breakpoint + atom composition; PostCard Meta slot, h3, card padding"
```

---

## Task 10: New organism — LatestPosts

**Files:**

- Create: `packages/ui/src/organisms/latest-posts/latest-posts-variants.ts`
- Create: `packages/ui/src/organisms/latest-posts/latest-posts.tsx`
- Create: `packages/ui/src/organisms/latest-posts/latest-posts.test.tsx`
- Create: `packages/ui/src/organisms/latest-posts/index.ts`

**Why:** The spec has a dedicated `LatestPosts` organism. Currently `ContentSection` + `PostGrid` does this job, but the spec's organism has a mono `p` label ("Latest") and a 1→2→3 column grid — not a generic section heading.

**Interfaces:**

- Produces: `<LatestPosts posts={IPostCardData[]} title="Latest" titleId="latest-posts-title" />`
- `IPostCardData` = `{ id, href, title, excerpt, publishedAt, formattedDate, categories: [{title}] }`
- Note: This organism is pure UI — it receives pre-formatted data. The `apps/web` route maps service data to this shape.

- [ ] **Step 1: Write failing tests**

```tsx
// packages/ui/src/organisms/latest-posts/latest-posts.test.tsx
import { render, screen } from '@testing-library/react';
import { LatestPosts } from './latest-posts';

const posts = [
  {
    id: '1',
    href: '/posts/a',
    title: 'Post A',
    excerpt: 'Summary A',
    publishedAt: '2026-06-01',
    formattedDate: '2026-06-01',
    categories: [{ title: 'Architecture' }],
  },
  {
    id: '2',
    href: '/posts/b',
    title: 'Post B',
    excerpt: 'Summary B',
    publishedAt: '2026-05-01',
    formattedDate: '2026-05-01',
    categories: [{ title: 'Design' }],
  },
];

describe('<LatestPosts />', () => {
  it('renders the section title', () => {
    render(<LatestPosts posts={posts} title="Latest" titleId="latest-title" />);
    expect(screen.getByText('Latest')).toBeVisible();
  });

  it('renders all post titles', () => {
    render(<LatestPosts posts={posts} title="Latest" titleId="latest-title" />);
    expect(screen.getByText('Post A')).toBeVisible();
    expect(screen.getByText('Post B')).toBeVisible();
  });

  it('uses aria-labelledby for section', () => {
    render(<LatestPosts posts={posts} title="Latest" titleId="my-id" />);
    expect(screen.getByRole('region', { name: 'Latest' })).toBeInTheDocument();
  });

  it('renders nothing when posts is empty', () => {
    const { container } = render(
      <LatestPosts posts={[]} title="Latest" titleId="t" />,
    );
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
pnpm --filter @blog/ui test -- latest-posts
```

- [ ] **Step 3: Implement**

```ts
// packages/ui/src/organisms/latest-posts/latest-posts-variants.ts
import { tv } from 'tailwind-variants';

export const latestPostsVariants = tv({
  slots: {
    root: 'mt-[22px]',
    label: 'm-0 mb-3 font-mono text-label uppercase tracking-label text-subtle',
    grid: 'grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3',
  },
});
```

```tsx
// packages/ui/src/organisms/latest-posts/latest-posts.tsx
import Link from 'next/link';
import { CardMeta } from '@blog/ui/molecules/card-meta';
import { PostCard } from '@blog/ui/molecules/post-card';
import { latestPostsVariants } from './latest-posts-variants';

export interface IPostCardData {
  id: string;
  href: string;
  title: string;
  excerpt?: string;
  publishedAt: string;
  formattedDate: string;
  categories: { title: string }[];
}

interface ILatestPostsProps {
  posts: IPostCardData[];
  title: string;
  titleId: string;
}

export const LatestPosts = ({ posts, title, titleId }: ILatestPostsProps) => {
  if (posts.length === 0) return null;
  const { root, label, grid } = latestPostsVariants();

  return (
    <section aria-labelledby={titleId} className={root()}>
      <p id={titleId} className={label()}>
        {title}
      </p>
      <div className={grid()}>
        {posts.map((post) => (
          <PostCard key={post.id} excerpt={post.excerpt}>
            <PostCard.Meta
              key="meta"
              dateIso={post.publishedAt}
              dateLabel={post.formattedDate}
              category={post.categories[0]?.title ?? ''}
            />
            <PostCard.Title key="title">
              <Link
                href={post.href}
                className="outline-none before:absolute before:inset-0"
              >
                {post.title}
              </Link>
            </PostCard.Title>
          </PostCard>
        ))}
      </div>
    </section>
  );
};
```

```ts
// packages/ui/src/organisms/latest-posts/index.ts
export * from './latest-posts';
```

- [ ] **Step 4: Run to confirm PASS**

```bash
pnpm --filter @blog/ui test -- latest-posts
```

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/organisms/latest-posts
git commit -m "feat(ui): add LatestPosts organism"
```

---

## Task 11: Refactor ThemeToggle → pure + apps/web client wrapper

**Files:**

- Modify: `packages/ui/src/atoms/theme-toggle/theme-toggle-variants.ts`
- Modify: `packages/ui/src/atoms/theme-toggle/theme-toggle.tsx`
- Modify: `packages/ui/src/atoms/theme-toggle/theme-toggle.test.tsx`
- Create: `apps/web/src/components/theme-toggle-button/theme-toggle-button.tsx`

**Why:** `ThemeToggle` has `'use client'` — violates `@blog/ui` pure rule. Split: `ThemeToggle` becomes a controlled pure component; client state moves to `ThemeToggleButton` in `apps/web`.

- [ ] **Step 1: Update ThemeToggle variants — 22×22 size, no hover bg**

```ts
// packages/ui/src/atoms/theme-toggle/theme-toggle-variants.ts
import { tv } from 'tailwind-variants';

export const themeToggleVariants = tv({
  base: [
    'inline-grid size-[22px] place-items-center',
    'rounded-sm border border-transparent bg-transparent p-0',
    'text-muted transition-colors duration-base ease-console',
    'hover:text-text',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
  ],
});

export const themeTogglePlaceholderVariants = tv({
  base: 'block size-[18px]',
});
```

- [ ] **Step 2: Rewrite ThemeToggle as pure controlled component (no `use client`)**

```tsx
// packages/ui/src/atoms/theme-toggle/theme-toggle.tsx
import type { IWithDataTestId } from '@blog/config';
import { Moon, Sun } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import {
  themeTogglePlaceholderVariants,
  themeToggleVariants,
} from './theme-toggle-variants';

export interface IThemeToggleProps
  extends
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>,
    IWithDataTestId {
  isDark: boolean;
  onToggle: () => void;
  lightLabel?: string;
  darkLabel?: string;
  mounted?: boolean;
}

export const ThemeToggle = ({
  isDark,
  onToggle,
  mounted = true,
  lightLabel = 'Switch to light theme',
  darkLabel = 'Switch to dark theme',
  className,
  dataTestId,
  ...rest
}: IThemeToggleProps) => {
  const label = isDark ? lightLabel : darkLabel;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      title={label}
      data-testid={dataTestId}
      className={themeToggleVariants({ class: className })}
      {...rest}
    >
      {mounted ? (
        isDark ? (
          <Sun size={18} strokeWidth={1.6} aria-hidden="true" />
        ) : (
          <Moon size={18} strokeWidth={1.6} aria-hidden="true" />
        )
      ) : (
        <span className={themeTogglePlaceholderVariants()} aria-hidden="true" />
      )}
    </button>
  );
};
```

- [ ] **Step 3: Update ThemeToggle tests (prop-driven)**

```tsx
// packages/ui/src/atoms/theme-toggle/theme-toggle.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from './theme-toggle';

describe('<ThemeToggle />', () => {
  it('shows "Switch to dark theme" when isDark is false', () => {
    render(<ThemeToggle isDark={false} onToggle={() => {}} />);
    expect(
      screen.getByRole('button', { name: 'Switch to dark theme' }),
    ).toBeVisible();
  });

  it('shows "Switch to light theme" when isDark is true', () => {
    render(<ThemeToggle isDark onToggle={() => {}} />);
    expect(
      screen.getByRole('button', { name: 'Switch to light theme' }),
    ).toBeVisible();
  });

  it('calls onToggle on click', async () => {
    const onToggle = vi.fn();
    render(<ThemeToggle isDark={false} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('shows placeholder when not mounted', () => {
    const { container } = render(
      <ThemeToggle isDark={false} onToggle={() => {}} mounted={false} />,
    );
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run to confirm PASS**

```bash
pnpm --filter @blog/ui test -- theme-toggle
```

- [ ] **Step 5: Create ThemeToggleButton in apps/web**

```tsx
// apps/web/src/components/theme-toggle-button/theme-toggle-button.tsx
'use client';

import { ThemeToggle } from '@blog/ui';
import { useEffect, useState } from 'react';

type TTheme = 'light' | 'dark';

const readTheme = (): TTheme => {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
};

export const ThemeToggleButton = () => {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<TTheme>('light');

  useEffect(() => {
    setTheme(readTheme());
    setMounted(true);
  }, []);

  const handleToggle = () => {
    const next: TTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    document.documentElement.style.colorScheme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {}
    setTheme(next);
  };

  return (
    <ThemeToggle
      isDark={theme === 'dark'}
      onToggle={handleToggle}
      mounted={mounted}
    />
  );
};
```

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/atoms/theme-toggle apps/web/src/components/theme-toggle-button
git commit -m "refactor(ui): ThemeToggle → pure; client state in apps/web ThemeToggleButton"
```

---

## Task 12: Export updates + remove cn.ts

**Files:**

- Modify: `packages/ui/src/atoms/index.ts`
- Modify: `packages/ui/src/molecules/index.ts`
- Modify: `packages/ui/src/organisms/index.ts`
- Delete: `packages/ui/src/utils/cn.ts`

- [ ] **Step 1: Update atoms/index.ts**

```ts
export * from './avatar';
export * from './button';
export * from './caption';
export * from './eyebrow';
export * from './heading';
export * from './icon-button';
export * from './logo';
export * from './media-frame';
export * from './meta-separator';
export * from './nav-link';
export * from './tag';
export * from './text';
export * from './theme-toggle';
```

- [ ] **Step 2: Update molecules/index.ts**

```ts
export * from './action-list';
export * from './card-meta';
export * from './image-with-caption';
export * from './link-button';
export * from './post-card';
export * from './primary-navigation';
export * from './tag-list';
```

- [ ] **Step 3: Update organisms/index.ts**

```ts
export * from './content-section';
export * from './footer';
export * from './header';
export * from './hero';
export * from './latest-posts';
export type { IPostGridProps } from './post-grid';
export { PostGrid } from './post-grid';
```

- [ ] **Step 4: Delete cn.ts (unused dead code)**

```bash
rm packages/ui/src/utils/cn.ts
```

- [ ] **Step 5: Run full test suite**

```bash
pnpm --filter @blog/ui test
```

Expected: all green

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/atoms/index.ts packages/ui/src/molecules/index.ts packages/ui/src/organisms/index.ts
git rm packages/ui/src/utils/cn.ts
git commit -m "chore(ui): export new atoms/molecules/organisms, remove cn.ts"
```

---

## Task 13: apps/web — HomePageTemplate + layout.tsx + page.tsx updates

**Files:**

- Create: `apps/web/src/components/templates/home-page-template.tsx`
- Modify: `apps/web/src/app/[locale]/layout.tsx`
- Modify: `apps/web/src/app/[locale]/page.tsx`

**Why:** `layout.tsx` uses raw `ThemeToggle` (now needs `ThemeToggleButton`) and doesn't use `Logo`. `page.tsx` manually composes `ContentSection + PostGrid` — should delegate to `LatestPosts`. `HomePageTemplate` extracts page-shell logic from the route file.

- [ ] **Step 1: Create HomePageTemplate**

```tsx
// apps/web/src/components/templates/home-page-template.tsx
import type { ReactNode } from 'react';
import { tv } from 'tailwind-variants';

const homeTemplateVariants = tv({
  slots: {
    shell: 'min-h-screen bg-bg font-read text-text',
    container: 'mx-auto max-w-page px-gutter py-page-y',
  },
});

interface IHomePageTemplateProps {
  header: ReactNode;
  hero: ReactNode;
  latestPosts: ReactNode;
  footer: ReactNode;
}

export const HomePageTemplate = ({
  header,
  hero,
  latestPosts,
  footer,
}: IHomePageTemplateProps) => {
  const { shell, container } = homeTemplateVariants();
  return (
    <div className={shell()}>
      {header}
      <div className={container()}>
        <main>
          {hero}
          {latestPosts}
        </main>
        {footer}
      </div>
    </div>
  );
};
```

> Note: The Header is currently sticky/full-width outside the container — keep that architecture. `HomePageTemplate` here wraps only the content area. Adjust if the design changes to put the header inside the container.

- [ ] **Step 2: Update layout.tsx — use Logo + ThemeToggleButton**

Add imports:

```tsx
import { Logo } from '@blog/ui';
import { ThemeToggleButton } from '@/components/theme-toggle-button/theme-toggle-button';
```

Remove `ThemeToggle` from `@blog/ui` import.

Change `<Header.Brand>`:

```tsx
<Header.Brand>
  <Link href="/" aria-label="Home">
    <Logo prefix="val" suffix=".dev" />
  </Link>
</Header.Brand>
```

Change `<ThemeToggle />` → `<ThemeToggleButton />` inside `Header.Actions`.

- [ ] **Step 3: Update page.tsx — use LatestPosts organism**

Replace the `ContentSection + PostGrid` block with `LatestPosts`:

```tsx
import { Hero, LatestPosts, LinkButton } from '@blog/ui';
// Remove: ContentSection, PostGrid, PostCard, NavLink (if only used here)

// In the JSX:
{
  latestPosts.length > 0 && (
    <LatestPosts
      posts={latestPosts.map((post) => ({
        id: post.id,
        href: `/blog/${post.slug}`,
        title: post.title,
        excerpt: post.excerpt,
        publishedAt: post.publishedAt,
        formattedDate: formatDate(post.publishedAt, locale),
        categories: post.categories,
      }))}
      title={latestPostsTitle}
      titleId="latest-posts-title"
    />
  );
}
```

- [ ] **Step 4: Type check and full test run**

```bash
pnpm type-check
pnpm --filter @blog/ui test
pnpm --filter @blog/web build
```

Expected: no errors

- [ ] **Step 5: Start dev server and QA**

```bash
pnpm --filter @blog/web dev
```

Open `http://localhost:3000` and verify:

- [ ] Logo: "val" + ".dev" in accent mono
- [ ] ThemeToggleButton: 22×22, icon color only on hover (no background)
- [ ] Light ↔ dark toggle works; no flash on refresh
- [ ] Hero: two-column at `lg` with image; single-column without
- [ ] LatestPosts: 1→2→3 columns; cards show `date · category` at top; title as `h3`
- [ ] Card hover: lifts 2px, border darkens; no shadow
- [ ] Footer: stacked mobile → row at `sm`
- [ ] Focus rings on all interactive elements
- [ ] Reduced-motion: no card lift

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/templates/home-page-template.tsx apps/web/src/app/[locale]/layout.tsx apps/web/src/app/[locale]/page.tsx
git commit -m "feat(web): HomePageTemplate, Logo, ThemeToggleButton, LatestPosts in home route"
```

---

## Deferred — Post Detail slice

These exist in the spec but are not in scope until the Post Detail page slice starts:

| Component          | Layer                 | Notes                                                                                     |
| ------------------ | --------------------- | ----------------------------------------------------------------------------------------- |
| `ProseLink`        | Atom                  | Accent-colored anchor with underline                                                      |
| `InlineCode`       | Atom                  | Mono span with surface-2 background                                                       |
| `PostMeta`         | Molecule              | Date · readTime · wordCount · categoryLink with top/bottom border                         |
| `CodeBlock`        | Molecule              | `<pre>` with filename label and copy button; `overflow-x-auto`                            |
| `QuoteBlock`       | Molecule              | `<blockquote>` with `accent-muted` left rule                                              |
| `ArticleHeader`    | Organism              | Eyebrow, post Heading, PostMeta, lead Text, optional ImageWithCaption                     |
| `ArticleBody`      | Organism              | Renders portable text blocks: Text, ProseLink, InlineCode, CodeBlock, QuoteBlock, TagList |
| `PostPageTemplate` | Template (`apps/web`) | Narrower `max-w-post` reading column                                                      |

---

## Full File Map

| File                                                                       | Action |
| -------------------------------------------------------------------------- | ------ |
| `packages/ui/src/atoms/logo/` (4 files)                                    | Create |
| `packages/ui/src/atoms/eyebrow/` (4 files)                                 | Create |
| `packages/ui/src/atoms/meta-separator/` (4 files)                          | Create |
| `packages/ui/src/atoms/text/` (4 files)                                    | Create |
| `packages/ui/src/atoms/media-frame/` (4 files)                             | Create |
| `packages/ui/src/atoms/caption/` (4 files)                                 | Create |
| `packages/ui/src/atoms/icon-button/` (4 files)                             | Create |
| `packages/ui/src/molecules/card-meta/` (4 files)                           | Create |
| `packages/ui/src/molecules/tag-list/` (4 files)                            | Create |
| `packages/ui/src/molecules/action-list/` (4 files)                         | Create |
| `packages/ui/src/molecules/image-with-caption/` (4 files)                  | Create |
| `packages/ui/src/molecules/primary-navigation/` (4 files)                  | Create |
| `packages/ui/src/organisms/latest-posts/` (4 files)                        | Create |
| `apps/web/src/components/theme-toggle-button/theme-toggle-button.tsx`      | Create |
| `apps/web/src/components/templates/home-page-template.tsx`                 | Create |
| `packages/ui/src/atoms/nav-link/nav-link-variants.ts`                      | Modify |
| `packages/ui/src/atoms/nav-link/nav-link.test.tsx`                         | Modify |
| `packages/ui/src/atoms/button/button-variants.ts`                          | Modify |
| `packages/ui/src/atoms/heading/heading-variants.ts`                        | Modify |
| `packages/ui/src/atoms/heading/heading.tsx`                                | Modify |
| `packages/ui/src/atoms/heading/heading.test.tsx`                           | Modify |
| `packages/ui/src/atoms/theme-toggle/theme-toggle.tsx`                      | Modify |
| `packages/ui/src/atoms/theme-toggle/theme-toggle-variants.ts`              | Modify |
| `packages/ui/src/atoms/theme-toggle/theme-toggle.test.tsx`                 | Modify |
| `packages/ui/src/atoms/index.ts`                                           | Modify |
| `packages/ui/src/molecules/post-card/post-card.tsx`                        | Modify |
| `packages/ui/src/molecules/post-card/post-card-variants.ts`                | Modify |
| `packages/ui/src/molecules/post-card/components/title/post-card-title.tsx` | Modify |
| `packages/ui/src/molecules/post-card/post-card.test.tsx`                   | Modify |
| `packages/ui/src/molecules/index.ts`                                       | Modify |
| `packages/ui/src/organisms/hero/hero.tsx`                                  | Modify |
| `packages/ui/src/organisms/hero/hero-variants.ts`                          | Modify |
| `packages/ui/src/organisms/index.ts`                                       | Modify |
| `packages/ui/src/utils/cn.ts`                                              | Delete |
| `apps/web/src/app/[locale]/layout.tsx`                                     | Modify |
| `apps/web/src/app/[locale]/page.tsx`                                       | Modify |
