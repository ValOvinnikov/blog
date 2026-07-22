# Home page atomic component implementation instructions

Source design: Console direction A — azure serif. This file applies only to the Home page rollout. Post Detail work is deferred.

This file follows the same structure as the provided reference instruction file, but all conditional styling uses `tailwind-variants` instead of `cn()`.

## 0. Global assumptions before implementation

Read `shared-foundations-and-rules.md` first.

Required Tailwind utilities come from `configs/tailwind/theme.css`, consumed through `@blog/tailwind-config/theme.css`.

Important implementation rules:

- Use `tv()` from `tailwind-variants` for component variants and conditional classes.
- Do not use `cn()`.
- Components should not set page-level margins unless explicitly stated.
- Templates/pages own placement.
- Components own internal styling.
- Build mobile-first, then add `sm:`, `md:`, and `lg:` rules as specified.
- Use semantic tokens only: `bg-bg`, `bg-surface`, `text-text`, `text-muted`, `border-border`, etc.

Use the existing repo structure:

```txt
packages/ui/src/atoms/
packages/ui/src/molecules/
packages/ui/src/organisms/
apps/web/src/app/[locale]/page.tsx
```

Do not add Home templates to `@blog/ui`. The localized Next.js route owns page
composition.

Responsive baseline:

- Default layouts are single-column.
- Use `sm:` for two-column card grid and footer row.
- Use `lg:` for the Home hero media split.
- Do not reserve media space if optional image data is missing.
- Use `motion-reduce:transition-none motion-reduce:transform-none` on animated/hovered components.

---

## 1. Atoms used by Home page

### 1.1 `Logo`

Path: `src/components/atoms/Logo.tsx`

Purpose: Brand wordmark used in `SiteHeader`.

Tailwind classes:

```txt
root: inline-flex items-baseline whitespace-nowrap font-display text-[19px] font-medium tracking-[-0.01em] text-text
suffix: font-mono text-sm font-normal text-accent
```

Responsive behaviour:

- No breakpoint-specific styling.
- Keep the wordmark one line with `whitespace-nowrap`.
- Do not add margins.

Implementation shape:

```tsx
import { tv } from 'tailwind-variants';

const logoStyles = tv({
  slots: {
    root: 'inline-flex items-baseline whitespace-nowrap font-display text-[19px] font-medium tracking-[-0.01em] text-text',
    suffix: 'font-mono text-sm font-normal text-accent',
  },
});

export function Logo() {
  const { root, suffix } = logoStyles();

  return (
    <span className={root()}>
      val<span className={suffix()}>.dev</span>
    </span>
  );
}
```

Accessibility:

- If used as a link, wrap with `Link` and add `aria-label="Home"`.

---

### 1.2 `NavLink`

Path: `src/components/atoms/NavLink.tsx`

Purpose: Header navigation item.

Tailwind classes:

```txt
base: font-mono text-meta text-subtle no-underline transition-colors duration-base ease-console
hover/focus: hover:text-text focus-visible:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg
active: text-accent
```

Responsive behaviour:

- Allow wrapping inside `PrimaryNavigation`.
- Do not set margins or fixed widths.

Implementation shape:

```tsx
import Link from 'next/link';
import { tv, type VariantProps } from 'tailwind-variants';

const navLinkStyles = tv({
  base: [
    'font-mono text-meta text-subtle no-underline',
    'transition-colors duration-base ease-console',
    'hover:text-text focus-visible:text-text',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
  ],
  variants: {
    active: {
      true: 'text-accent',
    },
  },
});

type NavLinkProps = React.ComponentProps<typeof Link> &
  VariantProps<typeof navLinkStyles>;

export function NavLink({ active, className, ...props }: NavLinkProps) {
  return (
    <Link className={navLinkStyles({ active, class: className })} {...props} />
  );
}
```

---

### 1.3 `IconButton` / `ThemeToggleButton`

Path: `src/components/atoms/IconButton.tsx`

Purpose: Small unfilled icon button used for the theme toggle in the header.

Tailwind classes:

```txt
button: inline-grid size-[22px] place-items-center rounded-sm border border-transparent bg-transparent p-0 text-muted transition-colors duration-base ease-console
states: hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg
svg: size-[18px]
```

Responsive behaviour:

- No breakpoint-specific styling.
- Keep it inside nav flow; do not position absolutely.
- Do not increase touch target unless the wider design changes. The visual reference uses a compact header control.

Implementation shape:

```tsx
import { tv } from 'tailwind-variants';

const iconButtonStyles = tv({
  slots: {
    button: [
      'inline-grid size-[22px] place-items-center rounded-sm border border-transparent bg-transparent p-0 text-muted',
      'transition-colors duration-base ease-console hover:text-text',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    ],
    icon: 'size-[18px]',
  },
});

export function IconButton({ label, children, ...props }: IconButtonProps) {
  const { button } = iconButtonStyles();

  return (
    <button type="button" aria-label={label} className={button()} {...props}>
      {children}
    </button>
  );
}
```

---

### 1.4 `Eyebrow`

Path: `src/components/atoms/Eyebrow.tsx`

Purpose: Uppercase mono label used in Home hero and Post article header.

Tailwind classes:

```txt
base: font-mono text-label font-medium uppercase tracking-eyebrow text-accent
```

Responsive behaviour:

- No breakpoint-specific styling.
- Keep it content-width; do not force block spacing.

Implementation shape:

```tsx
import { tv } from 'tailwind-variants';

const eyebrowStyles = tv({
  base: 'font-mono text-label font-medium uppercase tracking-eyebrow text-accent',
});

export function Eyebrow({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={eyebrowStyles({ class: className })} {...props} />;
}
```

---

### 1.5 `Heading`

Path: `src/components/atoms/Heading.tsx`

Purpose: Shared heading primitive with visual variants. Home uses `hero` and `card`. Post Detail will extend/reuse it with `post`.

Variant classes:

```txt
base: font-display font-medium text-text
hero: text-hero tracking-tight-hero
post: text-post-title tracking-tight-display
card: text-card-title tracking-tight-card
```

Placement classes are not part of the atom:

```txt
Home hero title placement: mt-2.5 mb-3 max-w-[16ch]
Post title placement: mt-3 max-w-[18ch]
Post card title placement: m-0 mb-[5px]
```

Responsive behaviour:

- `hero` and `post` use token-level `clamp()` sizes.
- Keep width constraints in parent organisms.
- Do not add margins in this atom.

Implementation shape:

```tsx
import { tv, type VariantProps } from 'tailwind-variants';

const headingStyles = tv({
  base: 'font-display font-medium text-text',
  variants: {
    level: {
      hero: 'text-hero tracking-tight-hero',
      post: 'text-post-title tracking-tight-display',
      card: 'text-card-title tracking-tight-card',
      section: 'text-title-2xl tracking-tight-display',
    },
  },
  defaultVariants: {
    level: 'section',
  },
});

type HeadingProps = React.ComponentProps<'h1'> &
  VariantProps<typeof headingStyles> & {
    as?: 'h1' | 'h2' | 'h3' | 'h4';
  };

export function Heading({
  as: Comp = 'h2',
  level,
  className,
  ...props
}: HeadingProps) {
  return (
    <Comp className={headingStyles({ level, class: className })} {...props} />
  );
}
```

---

### 1.6 `Text`

Path: `src/components/atoms/Text.tsx`

Purpose: Serif body copy. Home uses muted hero subtitle and card descriptions.

Variant classes:

```txt
base: font-read text-lead text-text
hero: text-base leading-[1.6] text-muted md:text-[1.0625rem]
card: text-card-copy text-muted
lead: text-lead text-text
muted: text-lead text-muted
```

Responsive behaviour:

- Hero text becomes slightly larger from `md` upward.
- Do not set max width in the atom.
- Parent organisms control measure with `max-w-*`.

Implementation shape:

```tsx
import { tv, type VariantProps } from 'tailwind-variants';

const textStyles = tv({
  base: 'font-read',
  variants: {
    variant: {
      lead: 'text-lead text-text',
      muted: 'text-lead text-muted',
      hero: 'text-base leading-[1.6] text-muted md:text-[1.0625rem]',
      card: 'text-card-copy text-muted',
    },
  },
  defaultVariants: {
    variant: 'lead',
  },
});

type TextProps = React.ComponentProps<'p'> & VariantProps<typeof textStyles>;

export function Text({ variant, className, ...props }: TextProps) {
  return <p className={textStyles({ variant, class: className })} {...props} />;
}
```

---

### 1.7 `Button`

Path: `src/components/atoms/Button.tsx`

Purpose: Hero actions. Home uses `primary` and `link`; keep `ghost` because it appears in the component system and may be reused later.

Base classes:

```txt
inline-flex min-h-9 items-center justify-center rounded-sm border px-4 py-2 font-display text-copy font-medium transition-colors duration-base ease-console focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50
```

Variant classes:

```txt
primary: border-transparent bg-accent text-accent-contrast hover:bg-accent-hover
ghost: border-border-strong bg-transparent text-text hover:border-accent hover:text-accent
link: border-transparent bg-transparent px-1 text-accent underline underline-offset-[3px] hover:text-accent-hover
```

Responsive behaviour:

- Buttons wrap via `ActionList` on small screens.
- Do not force full-width buttons.
- Keep tap/click area stable across breakpoints.

Implementation shape:

```tsx
import Link from 'next/link';
import { tv, type VariantProps } from 'tailwind-variants';

const buttonStyles = tv({
  base: [
    'inline-flex min-h-9 items-center justify-center rounded-sm border px-4 py-2',
    'font-display text-copy font-medium transition-colors duration-base ease-console',
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
  },
  defaultVariants: {
    variant: 'primary',
  },
});

type ButtonProps = VariantProps<typeof buttonStyles> & {
  href?: string;
  className?: string;
  children: React.ReactNode;
};

export function Button({
  href,
  variant,
  className,
  children,
  ...props
}: ButtonProps) {
  const classNames = buttonStyles({ variant, class: className });

  if (href) {
    return (
      <Link href={href} className={classNames}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classNames} {...props}>
      {children}
    </button>
  );
}
```

---

### 1.8 `MetaSeparator`

Path: `src/components/atoms/MetaSeparator.tsx`

Purpose: Dot separator inside metadata lines.

Tailwind classes:

```txt
mx-[7px] text-border-strong
```

Responsive behaviour:

- No breakpoint-specific styling.
- Metadata parents allow wrapping; separator remains inline.

Implementation shape:

```tsx
import { tv } from 'tailwind-variants';

const metaSeparatorStyles = tv({
  base: 'mx-[7px] text-border-strong',
});

export function MetaSeparator() {
  return (
    <span aria-hidden="true" className={metaSeparatorStyles()}>
      ·
    </span>
  );
}
```

---

## 2. Molecules used by Home page

### 2.1 `PrimaryNavigation`

Path: `src/components/molecules/PrimaryNavigation.tsx`

Uses:

- `NavLink`
- `ThemeToggleButton`

Tailwind classes:

```txt
nav: flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2
```

Responsive behaviour:

- Mobile: links wrap if needed.
- Desktop: links stay in one row naturally.
- Do not hide links behind a menu unless a future design adds a mobile menu.
- No horizontal scrolling.

Implementation shape:

```tsx
import { tv } from 'tailwind-variants';

const primaryNavigationStyles = tv({
  base: 'flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2',
});

export function PrimaryNavigation() {
  return (
    <nav aria-label="Primary" className={primaryNavigationStyles()}>
      <NavLink href="/writing">writing</NavLink>
      <NavLink href="/projects">projects</NavLink>
      <NavLink href="/about">about</NavLink>
      <ThemeToggleButton />
    </nav>
  );
}
```

---

### 2.2 `SiteHeader`

Path: `src/components/molecules/SiteHeader.tsx`

Uses:

- `Logo`
- `PrimaryNavigation`

Tailwind classes:

```txt
header: flex flex-wrap items-center justify-between gap-x-5 gap-y-3 border-b border-border pb-4
logoLink: shrink-0
```

Responsive behaviour:

- Mobile: header can wrap into two rows if the viewport is too narrow.
- Desktop: logo left, navigation right.
- Do not use absolute positioning.
- Do not hide nav items.

Implementation shape:

```tsx
import Link from 'next/link';
import { tv } from 'tailwind-variants';

const siteHeaderStyles = tv({
  slots: {
    root: 'flex flex-wrap items-center justify-between gap-x-5 gap-y-3 border-b border-border pb-4',
    logoLink: 'shrink-0',
  },
});

export function SiteHeader() {
  const { root, logoLink } = siteHeaderStyles();

  return (
    <header className={root()}>
      <Link href="/" aria-label="Home" className={logoLink()}>
        <Logo />
      </Link>
      <PrimaryNavigation />
    </header>
  );
}
```

---

### 2.3 `ActionList`

Path: `src/components/molecules/ActionList.tsx`

Uses:

- `Button`

Tailwind classes:

```txt
root: mt-[18px] flex flex-wrap items-center gap-3
```

Responsive behaviour:

- Mobile: buttons wrap to next line when needed.
- Do not make the row full width.
- Do not add bottom margin.

Implementation shape:

```tsx
import { tv } from 'tailwind-variants';

const actionListStyles = tv({
  base: 'mt-[18px] flex flex-wrap items-center gap-3',
});

export function ActionList({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return <div className={actionListStyles({ class: className })} {...props} />;
}
```

---

### 2.4 `CardMeta`

Path: `src/components/molecules/CardMeta.tsx`

Purpose: Metadata line inside `PostCard`.

Uses:

- `MetaSeparator`

Tailwind classes:

```txt
root: mb-1.5 flex flex-wrap items-center gap-y-1 font-mono text-label text-subtle
category: text-accent
```

Responsive behaviour:

- Allow wrapping on very narrow cards.
- Keep category uppercase from data or transform it in the component.
- Do not clip metadata.

Implementation shape:

```tsx
import { tv } from 'tailwind-variants';

const cardMetaStyles = tv({
  slots: {
    root: 'mb-1.5 flex flex-wrap items-center gap-y-1 font-mono text-label text-subtle',
    category: 'text-accent',
  },
});

export function CardMeta({
  dateIso,
  dateLabel,
  readingTime,
  category,
}: CardMetaProps) {
  const { root, category: categoryStyle } = cardMetaStyles();

  return (
    <div className={root()}>
      <time dateTime={dateIso}>{dateLabel}</time>
      <MetaSeparator />
      <span>{readingTime}</span>
      <MetaSeparator />
      <span className={categoryStyle()}>{category.toUpperCase()}</span>
    </div>
  );
}
```

---

### 2.5 `PostCard`

Path: `src/components/molecules/PostCard.tsx`

Purpose: Card for latest posts on the Home page.

Uses:

- `CardMeta`
- `Heading` variant `card`
- `Text` variant `card`

Tailwind classes:

```txt
root: relative rounded-md border border-border bg-surface px-card-x py-card-y transition-[transform,border-color] duration-base ease-console hover:-translate-y-0.5 hover:border-border-strong focus-within:-translate-y-0.5 focus-within:border-border-strong motion-reduce:transition-none motion-reduce:transform-none
title: m-0 mb-[5px]
link: outline-none before:absolute before:inset-0
description: m-0
```

Responsive behaviour:

- Card itself has no width rules.
- Width is controlled by `LatestPosts` grid.
- Hover lift is harmless on touch devices.
- Use `motion-reduce` classes to avoid motion for users who prefer reduced motion.

Implementation shape:

```tsx
import Link from 'next/link';
import { tv } from 'tailwind-variants';

const postCardStyles = tv({
  slots: {
    root: [
      'relative rounded-md border border-border bg-surface px-card-x py-card-y',
      'transition-[transform,border-color] duration-base ease-console',
      'hover:-translate-y-0.5 hover:border-border-strong',
      'focus-within:-translate-y-0.5 focus-within:border-border-strong',
      'motion-reduce:transition-none motion-reduce:transform-none',
    ],
    title: 'm-0 mb-[5px]',
    link: 'outline-none before:absolute before:inset-0',
    description: 'm-0',
  },
});

export function PostCard({ href, title, description, meta }: PostCardProps) {
  const {
    root,
    title: titleStyle,
    link,
    description: descriptionStyle,
  } = postCardStyles();

  return (
    <article className={root()}>
      <CardMeta {...meta} />
      <Heading as="h3" level="card" className={titleStyle()}>
        <Link href={href} className={link()}>
          {title}
        </Link>
      </Heading>
      <Text variant="card" className={descriptionStyle()}>
        {description}
      </Text>
    </article>
  );
}
```

> **Decision record (2026-07-21, issue #624, epic #612):** the reference
> `PostCard` above is text-only — no thumbnail. The actual `@blog/ui`
> `PostCard` (`packages/ui/src/molecules/post-card/`) is a compound
> component that includes a `PostCard.Media` slot for an optional
> thumbnail. This is intentional, not drift to reconcile: it matches
> issue #74's acceptance criteria, which predates and supersedes this
> design reference's text-only mock for `PostCard`. Do not "fix" `PostCard`
> back to thumbnail-less to match this reference — the reference is stale
> on this point; `@blog/ui`'s compound `Media` slot is the source of truth.

---

### 2.6 `MediaFrame`

Path: `src/components/atoms/MediaFrame.tsx`

Purpose: Shared image frame. Home uses it for the optional hero image. Post Detail reuses it for the optional cover image.

Tailwind classes:

```txt
root: relative isolate overflow-hidden rounded-lg border border-border bg-surface-2
image: size-full object-cover
```

Responsive behaviour:

- Aspect ratio is passed by the parent.
- The image fills the frame.
- Component returns only a frame; optional rendering belongs to parent.

Implementation shape:

```tsx
import Image from 'next/image';
import { tv } from 'tailwind-variants';

const mediaFrameStyles = tv({
  slots: {
    root: 'relative isolate overflow-hidden rounded-lg border border-border bg-surface-2',
    image: 'object-cover',
  },
});

export function MediaFrame({
  src,
  alt,
  sizes,
  priority,
  className,
}: MediaFrameProps) {
  const { root, image } = mediaFrameStyles();

  return (
    <div className={root({ class: className })}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={image()}
      />
    </div>
  );
}
```

---

## 3. Organisms used by Home page

### 3.1 `HomeHero`

Path: `src/components/organisms/HomeHero.tsx`

Purpose: Home page hero with optional image.

Uses:

- `Eyebrow`
- `Heading` variant `hero`
- `Text` variant `hero`
- `ActionList`
- `Button`
- `MediaFrame`

Root classes when no image:

```txt
grid grid-cols-1 items-center gap-[clamp(1.25rem,4vw,2rem)] py-[26px] pb-2
```

Root classes when image exists:

```txt
grid grid-cols-1 items-center gap-[clamp(1.25rem,4vw,2rem)] py-[26px] pb-2 lg:grid-cols-[minmax(0,1.15fr)_minmax(180px,0.85fr)]
```

Child classes:

```txt
copy: min-w-0
title: mt-2.5 mb-3 max-w-[16ch]
subtitle: m-0 max-w-[52ch]
figure: m-0
media: aspect-[4/3] min-h-[170px]
```

Responsive behaviour:

- `<1024px`: single column. Text first, image second.
- `lg+`: two columns only when `image` exists.
- If `image` is missing, do not add the `lg:grid-cols-*` class and do not render an empty figure.
- Keep the title narrow at all widths using `max-w-[16ch]`.
- Optional image keeps `4 / 3` ratio and minimum height of `170px`.

Implementation shape:

```tsx
import { tv } from 'tailwind-variants';

const homeHeroStyles = tv({
  slots: {
    root: 'grid grid-cols-1 items-center gap-[clamp(1.25rem,4vw,2rem)] py-[26px] pb-2',
    copy: 'min-w-0',
    title: 'mt-2.5 mb-3 max-w-[16ch]',
    subtitle: 'm-0 max-w-[52ch]',
    figure: 'm-0',
    media: 'aspect-[4/3] min-h-[170px]',
  },
  variants: {
    hasImage: {
      true: {
        root: 'lg:grid-cols-[minmax(0,1.15fr)_minmax(180px,0.85fr)]',
      },
    },
  },
});

export function HomeHero({
  eyebrow,
  title,
  subtitle,
  image,
  actions,
}: HomeHeroProps) {
  const {
    root,
    copy,
    title: titleStyle,
    subtitle: subtitleStyle,
    figure,
    media,
  } = homeHeroStyles({ hasImage: Boolean(image) });

  return (
    <section aria-labelledby="home-hero-title" className={root()}>
      <div className={copy()}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <Heading
          id="home-hero-title"
          as="h1"
          level="hero"
          className={titleStyle()}
        >
          {title}
        </Heading>
        <Text variant="hero" className={subtitleStyle()}>
          {subtitle}
        </Text>
        <ActionList>
          <Button href={actions.primary.href} variant="primary">
            {actions.primary.label}
          </Button>
          <Button href={actions.secondary.href} variant="link">
            {actions.secondary.label}
          </Button>
        </ActionList>
      </div>

      {image ? (
        <figure className={figure()}>
          <MediaFrame
            src={image.src}
            alt={image.alt}
            sizes="(min-width: 1024px) 34rem, 100vw"
            priority
            className={media()}
          />
        </figure>
      ) : null}
    </section>
  );
}
```

---

### 3.2 `LatestPosts`

Path: `src/components/organisms/LatestPosts.tsx`

Purpose: Latest posts grid on the Home page.

Uses:

- `PostCard`

Tailwind classes:

```txt
root: mt-[22px]
label: m-0 mb-3 font-mono text-label uppercase tracking-label text-subtle
grid: grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3
```

Responsive behaviour:

- Mobile: 1 column.
- `sm`: 2 columns.
- `lg`: 3 columns.
- Use predictable grid columns; do not use `auto-fit` if the design should match the mock.

Implementation shape:

```tsx
import { tv } from 'tailwind-variants';

const latestPostsStyles = tv({
  slots: {
    root: 'mt-[22px]',
    label: 'm-0 mb-3 font-mono text-label uppercase tracking-label text-subtle',
    grid: 'grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3',
  },
});

export function LatestPosts({ posts }: LatestPostsProps) {
  const { root, label, grid } = latestPostsStyles();

  return (
    <section aria-labelledby="latest-posts-title" className={root()}>
      <p id="latest-posts-title" className={label()}>
        Latest
      </p>
      <div className={grid()}>
        {posts.map((post) => (
          <PostCard key={post.slug} {...post} />
        ))}
      </div>
    </section>
  );
}
```

---

### 3.3 `SiteFooter`

Path: `src/components/organisms/SiteFooter.tsx`

Tailwind classes:

```txt
root: mt-[22px] flex flex-col gap-2 border-t border-border pt-3.5 font-mono text-label text-subtle sm:flex-row sm:items-center sm:justify-between
```

Responsive behaviour:

- Mobile: stacked footer lines.
- `sm+`: left/right row.
- Footer text should not overflow; allow wrapping if link list is long.

Implementation shape:

```tsx
import { tv } from 'tailwind-variants';

const siteFooterStyles = tv({
  base: 'mt-[22px] flex flex-col gap-2 border-t border-border pt-3.5 font-mono text-label text-subtle sm:flex-row sm:items-center sm:justify-between',
});

export function SiteFooter() {
  return (
    <footer className={siteFooterStyles()}>
      <span>© 2026 val.dev</span>
      <span>rss · github · linkedin</span>
    </footer>
  );
}
```

---

## 4. Home page template

Path: `src/components/templates/HomePageTemplate.tsx`

Uses:

- `SiteHeader`
- `HomeHero`
- `LatestPosts`
- `SiteFooter`

Tailwind classes:

```txt
shell: min-h-screen bg-bg text-text font-read
container: mx-auto max-w-page px-gutter py-page-y
```

Responsive behaviour:

- Container padding scales via `px-gutter` and `py-page-y`.
- Header wraps naturally.
- Hero becomes two-column only at `lg` and only when image exists.
- Latest cards: 1 → 2 → 3 columns.
- Footer: stacked → horizontal.

Implementation shape:

```tsx
import { tv } from 'tailwind-variants';

const homePageTemplateStyles = tv({
  slots: {
    shell: 'min-h-screen bg-bg text-text font-read',
    container: 'mx-auto max-w-page px-gutter py-page-y',
  },
});

export function HomePageTemplate({ hero, latestPosts }: HomePageTemplateProps) {
  const { shell, container } = homePageTemplateStyles();

  return (
    <div className={shell()}>
      <div className={container()}>
        <SiteHeader />
        <main>
          <HomeHero {...hero} />
          <LatestPosts posts={latestPosts} />
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
```

---

## 5. Home page data shape suggestion

Use this data shape or adapt it to the existing CMS/data layer:

```ts
export type HomeHeroData = {
  eyebrow: string;
  title: string;
  subtitle: string;
  image?: {
    src: string;
    alt: string;
  };
  actions: {
    primary: { href: string; label: string };
    secondary: { href: string; label: string };
  };
};

export type PostCardData = {
  slug: string;
  href: string;
  title: string;
  description: string;
  meta: {
    dateIso: string;
    dateLabel: string;
    readingTime: string;
    category: string;
  };
};
```

---

## 6. Home page build order for an AI agent

1. Confirm Tailwind tokens are available and dark mode uses `<html class="dark">`.
2. Confirm `tailwind-variants` is installed.
3. Implement atoms in this order: `Logo`, `NavLink`, `IconButton`, `Eyebrow`, `Heading`, `Text`, `Button`, `MetaSeparator`, `MediaFrame`.
4. Implement molecules in this order: `PrimaryNavigation`, `SiteHeader`, `ActionList`, `CardMeta`, `PostCard`.
5. Implement organisms in this order: `HomeHero`, `LatestPosts`, `SiteFooter`.
6. Implement `HomePageTemplate`.
7. Add or update `src/app/page.tsx` so it fetches/imports data and renders `HomePageTemplate`.
8. Verify light and dark modes.
9. Verify hero with image and hero without image.
10. Verify responsive widths: `375px`, `768px`, `1024px`, `1280px`.

---

## 7. Acceptance checklist

- No `cn()` helper is used.
- All variant styling uses `tv()` from `tailwind-variants`.
- No empty image column appears when the Home hero image is missing.
- Cards have border-based design and no shadow.
- Card hover moves up by `2px` and strengthens the border.
- Header nav wraps instead of overflowing.
- Text uses `Newsreader`; UI/headings use `Space Grotesk`; metadata uses `JetBrains Mono`.
- Page placement is controlled by `HomePageTemplate`; atoms/molecules do not add page-level spacing.
- All interactive elements have visible focus states.
- Motion is disabled for users with reduced-motion preferences.
