# Console atomic component implementation — shared foundations and rules

Use this file before the page-specific instructions. It defines shared tokens, project assumptions, implementation rules, and the `tailwind-variants` pattern used by the Home page rollout. Post Detail material in this folder is reference-only until the Post Detail slice starts.

## 1. Scope

This folder is not a project starter. It contains only:

- Tailwind tokens/config.
- Shared implementation rules.
- Home rollout AI build instructions.
- Responsive and accessibility QA notes.

Do not create a new Next.js project. Apply these files to the existing project.

## 2. Required libraries and styling approach

Use `tailwind-variants` for conditional and variant styling.

```tsx
import { tv, type VariantProps } from 'tailwind-variants';
```

Do not use a `cn()` helper in this component library. When a component needs external override classes, expose `className` and pass it into the `tv()` result with the `class` option.

Example for a single-slot component:

```tsx
const buttonStyles = tv({
  base: 'inline-flex items-center justify-center',
  variants: {
    variant: {
      primary: 'bg-accent text-accent-contrast',
      ghost: 'border border-border-strong text-text',
    },
  },
  defaultVariants: {
    variant: 'primary',
  },
});

export function Button({ variant, className, ...props }: ButtonProps) {
  return (
    <button
      className={buttonStyles({ variant, class: className })}
      {...props}
    />
  );
}
```

Example for a slotted component:

```tsx
const cardStyles = tv({
  slots: {
    root: 'relative rounded-md border border-border bg-surface',
    title: 'font-display text-card-title text-text',
    description: 'font-read text-card-copy text-muted',
  },
});

const { root, title, description } = cardStyles();
```

## 3. Tailwind token utilities assumed by the specs

Colours:

```txt
bg-bg bg-bg-subtle bg-surface bg-surface-2
border-border border-border-strong
text-text text-muted text-subtle text-accent text-accent-hover text-accent-muted text-accent-contrast
bg-accent bg-accent-hover bg-accent-muted
```

Fonts:

```txt
font-display font-read font-mono
```

Type:

```txt
text-display text-title-3xl text-title-2xl text-title-xl
text-hero text-post-title text-prose text-lead text-caption text-copy
text-card-title text-card-copy text-meta text-label text-code
```

Radius:

```txt
rounded-sm = 3px
rounded-md = 6px
rounded-lg = 10px
rounded-xl = 12px
```

Layout:

```txt
max-w-page = 70rem
max-w-post = 47.5rem
max-w-measure = 68ch
max-w-copy = 60ch
px-gutter = clamp(1rem, 5vw, 2.5rem)
py-page-y = clamp(1.5rem, 4vw, 2.5rem)
```

Motion:

```txt
duration-fast duration-base duration-slow ease-console
```

## 4. Dark mode

Use class-based dark mode:

```html
<html class="dark"></html>
```

The components should not contain separate `dark:` colour overrides for core theme colours. The semantic CSS variables already change when `.dark` is present. Use semantic tokens such as `bg-bg`, `bg-surface`, `text-text`, `text-muted`, and `border-border` everywhere.

## 5. Font loading

The design uses:

- Display/UI: `Space Grotesk`.
- Reading/prose: `Newsreader`.
- Metadata/code: `JetBrains Mono`.

In Next.js, load fonts with `next/font/google` in the app layout and map them to the same font-family names or CSS variables used by the tokens. Do not import fonts inside individual components.

## 6. Atomic design placement rule

Use this ownership model:

- Atoms own one small visual primitive.
- Molecules combine atoms into reusable UI parts.
- Organisms own section-level layout.
- Templates/pages own page-level placement, vertical page rhythm, and data composition.

Do not put page-level margins into atoms. For example, `Heading` should not add `mt-*`; `HomeHero` or `ArticleHeader` should place it.

## 7. Responsive baseline

All implementation should be mobile-first.

Global rules:

- Default to one column.
- Use `sm:` for simple two-column expansions such as card grids and footer rows.
- Use `lg:` for the Home hero media split.
- Do not reserve layout space for optional images when image data is missing.
- Let header navigation wrap instead of overflowing.
- Let metadata and tags wrap instead of clipping.
- Code blocks must scroll horizontally with `overflow-x-auto`.
- Use `motion-reduce:transition-none motion-reduce:transform-none` for components with movement.

Suggested viewport QA:

```txt
375px mobile
768px tablet
1024px desktop
1280px wide desktop
```

## 8. Accessibility baseline

- Every interactive element must have a visible focus state.
- Icon-only buttons need an `aria-label`.
- Decorative icons should use `aria-hidden="true"`.
- Image `alt` text should describe the content; purely decorative images should use empty alt text only when intentionally decorative.
- Use semantic landmarks: `header`, `nav`, `main`, `section`, `article`, `footer`.
- Use `time dateTime="YYYY-MM-DD"` for post dates.
- Use real links for navigation and post cards.

## 9. Component path convention

This repo already has its own structure. Adapt examples in these reference files
to the existing paths:

```txt
packages/ui/src/atoms/
packages/ui/src/molecules/
packages/ui/src/organisms/
apps/web/src/app/[locale]/page.tsx
```

Do not add a template layer to `@blog/ui`; page-level composition belongs in
`apps/web`.
