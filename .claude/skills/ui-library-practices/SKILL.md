---
name: ui-library-practices
description: >-
  Best practices for building components in the @blog/ui design system
  (packages/ui). Use when creating or editing atoms/molecules/organisms/
  templates, deciding component APIs, styling with Tailwind tokens, or keeping
  the library pure and publishable. Apply whenever touching packages/ui.
---

# UI library practices (`@blog/ui`)

This package is a **pure, prop-driven, Atomic Design** component library. It
must stay portable enough to publish to npm with zero edits.

## Purity rules (non-negotiable)
- **No data fetching.** Components receive plain typed props; they never call
  `service`, `fetch`, or import `sanity`/`next-sanity`.
- **No app coupling.** No `next/*` imports except `next/image`/`next/link` only
  if passed in as props/slots — prefer accepting `as`/`children` so the app owns
  framework specifics. Default to plain elements.
- Depend only on `@blog/types` for shapes. No business logic.

## Atomic Design layering
- `atoms/` — smallest primitives (Button, Tag, Heading, Avatar, Icon, Badge,
  Prose). No composition of other domain components.
- `molecules/` — small compositions (PostCard, AuthorByline, SocialLinks,
  CategoryPill, ShareButtons).
- `organisms/` — page sections (Hero, PostGrid, Header, Footer, PostMeta,
  Pagination).
- `templates/` — layout shells (PageLayout, PostLayout). **Portable Text is
  rendered here, not in `web`.**
- Each layer only composes layers below it. Re-export everything from
  `src/index.ts`.

## Component API conventions
- One component per file; named + default-less barrel re-export from `index.ts`.
- Props are an explicit `type`/`interface`, never inline. Extend the right DOM
  props (`React.ComponentPropsWithoutRef<"button">`) and spread `...rest` so
  consumers can pass `aria-*`, `id`, etc.
- Always forward `className`; merge with `clsx` + `tailwind-merge` (a `cn()`
  helper). Use `class-variance-authority` for variant/size matrices.
- Prefer composition (`children`, slots) over boolean prop explosions.
- Server-component-safe by default; add `"use client"` only for interactivity.

## Styling
- Tailwind v4 utility classes referencing shared tokens (`bg-bg`, `text-fg`,
  `text-muted`, `text-accent`, `border-border`, `font-sans`, `max-w-prose`)
  from `@blog/config/tailwind/preset`. No hard-coded hex values.
- Respect dark mode — tokens already switch via `prefers-color-scheme`.

## Accessibility
- Semantic elements first (`button`, `nav`, `article`, `time`). Interactive
  atoms expose focus-visible styles. Images require `alt`. Icon-only buttons get
  `aria-label`.

## Documentation & tests
- JSDoc every exported component (purpose + notable props) — makes Storybook
  trivial later.
- Co-locate a `Component.test.tsx` (Vitest + Testing Library). See
  `testing-practices`.

## Checklist before finishing
- [ ] No `service`/`sanity`/`fetch` imports.
- [ ] Props typed; `className` forwarded and merged with `cn()`.
- [ ] Uses token utilities, not raw colors; dark mode intact.
- [ ] Exported from the barrel; JSDoc present; test co-located.
