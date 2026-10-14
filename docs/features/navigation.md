---
title: Navigation
status: built
layers: [studio, service, ui, web]
code:
  - packages/studio/src/schema-types/documents/settings/navigation/**
  - packages/service/src/features/global/navigation/**
  - packages/ui/src/components/organisms/header/**
  - packages/ui/src/components/molecules/primary-navigation/**
  - packages/ui/src/components/atoms/nav-link/**
  - apps/web/src/components/shared/site-header/**
  - apps/web/src/components/shared/site-navigation/**
  - apps/web/src/hooks/use-mobile-nav-toggle/**
epics: [4987, 4995, 4998]
---

# Navigation

## What it does

The site header: the brand lockup, a single row of top-level links an editor curates, and trailing controls — the theme toggle, the reader account menu when reader accounts are on, and an optional language switcher. Below the `lg` breakpoint the links collapse into a toggled panel. The link for the page being read is marked current.

## Surfaces and routes

- **Public site:** every page rendered inside `app/[tenant]/[locale]/layout.tsx`, which mounts `SiteHeader`. The standalone 404 boundaries (`app/global-not-found.tsx`, `app/[tenant]/not-found.tsx`) render above that layout and have no header.
- **Studio:** Settings → Navigation, the `settings_navigation` singleton — Header Links and Show language switcher.
- **Platform:** no navigation editor. Look styles the header through the theme tokens and picks the switcher style.

## Data

- **`settings_navigation`:** `title`, `items[]` (each a `linkRef` — a bare reference to a `link` document), `showLanguageSwitcher` (boolean, initial `false`). Provisioning seeds it with no items, and seed verification requires the singleton and that every item resolves to a `link` document.
- **Service:** `service.global.navigation.v1.getNavigation(sanityContext)` returns `{ items: ILink[], showLanguageSwitcher? }`. Items resolve through `linkDocumentFragment` and `toLinkDocument` (./links.md) in the request language; an item whose link has no label or no resolvable href is dropped.
- **Cache:** the query is tagged `navigation`, `link` and every page type (`page_post`, `page_landing`, `page_postIndex`, `homePage`, `page_topic`, `page_topicIndex`, `page_tag`, `page_tagIndex`), tenant-scoped, so a target page's slug change refreshes the header. The publish webhook maps `settings_navigation` → `navigation` and `link` → `link`.
- **Alongside:** the brand comes from `settings_site` through `getSiteSettings`; the switcher style from `site_config.language_switcher_style`.

## Configuration

- **Editors** order the Header Links and turn the switcher on in Studio. A link's label and destination are edited on its `link` document, which updates every place it appears.
- With fewer than two live languages Studio hides the switcher toggle, and the switcher renders nothing anyway (./languages.md).
- **Look** sets the switcher style and every colour, font and radius the header uses (./look.md).
- The account menu shows only when reader accounts are enabled for the tenant (./reader-auth.md). Navigation itself is not plan-gated.

## Constraints and invariants

- A navigation item holds no label or destination of its own — always a `link` document reference. The list is flat (no nesting) and renders in the editor's order.
- An item is current when its href equals the locale-stripped pathname, or the pathname is under it (`/blog` matches `/blog/post`); `/` matches only itself. The current link carries `aria-current="page"` and NavLink's active colour.
- The mobile panel closes on every route change; `useMobileNavToggle` handles focus, Escape and outside-click dismissal, scoped to the navigation's own container.
- `actions` stay in the bar at every width; `panelActions` move into the mobile panel below `lg`. With the switcher on, the switcher and the theme toggle are `panelActions`; with it off, the theme toggle is an `action`. The account menu is always an `action`.
- The `<nav>` landmark is named by `PrimaryNavigation`'s default `ariaLabel`, `Primary`, in every language; the menu toggle's name is the catalog's `siteNavigation.toggleMenu`.
- A failed site-settings read renders no header; a failed navigation read is logged (`navigation.layout_fetch_failed`) and the header renders with no links and no switcher.
- `@blog/ui`'s `Header`, `PrimaryNavigation` and `NavLink` stay prop-driven: `apps/web` passes resolved links, `linkAs={SmartLink}` and the mobile toggle state.

## Dependencies

- Layers: `studio` (schema), `service` (loader), `ui` (header primitives), `web` (composition and client state).
- Features: ./links.md, ./languages.md, ./look.md, ./design-tokens-and-surfaces.md, ./reader-auth.md, ./rendering-and-caching.md, ./tenant-provisioning.md, ./footer-and-legal-pages.md. In-page section navigation belongs to ./landing-tree.md.
- Env: none of its own.

## Entry points

- `packages/studio/src/schema-types/documents/settings/navigation/navigation.ts`
- `packages/service/src/features/global/navigation/adaptor/query.ts`, `transformer.ts`
- `apps/web/src/components/shared/site-header/site-header.tsx`
- `apps/web/src/components/shared/site-navigation/site-navigation.tsx`
- `packages/ui/src/components/molecules/primary-navigation/primary-navigation.tsx`, `packages/ui/src/components/atoms/nav-link/nav-link-variants.ts`
- `apps/web/src/utils/revalidate-tags/revalidate-tags.ts` (webhook tag map)

## Tests and stories

- `packages/service/src/features/global/navigation/adaptor/loader.test.ts`
- `apps/web/src/components/shared/site-header/site-header.test.tsx`, `site-navigation/site-navigation.test.tsx`, `apps/web/src/hooks/use-mobile-nav-toggle/use-mobile-nav-toggle.test.tsx`
- `packages/ui`: `header.test.tsx`, `primary-navigation.test.tsx`, `nav-link.test.tsx`
- Stories: `packages/ui/src/components/organisms/header/header.stories.tsx`, `molecules/primary-navigation/primary-navigation.stories.tsx`, `atoms/nav-link/nav-link.stories.tsx`; `apps/web/src/components/shared/site-navigation/site-navigation.stories.tsx`, `brand-lockup-link/brand-lockup-link.stories.tsx`.

## Related

- #4987 — epic: accessible, correctly rendered text and colour on the public site.
- #4995 — the current page in navigation is marked by more than colour.
- #4998 — the header language pill cancels NavLink's current-page cue.
