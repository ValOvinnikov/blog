# Phase 4 — Unify links into a single `link` object — Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.
> Part of #242 · sub-issue **#249** · master plan
> `docs/superpowers/plans/2026-07-10-cms-schema-restructure-plan.md`.

**Goal:** Replace the `link` **document**, `navItem`, and `socialLink` with one
shared `link` **object** used everywhere (header nav, footer social, hero
secondary action), adding `openInNewTab` (external only) and a controlled
`platform` dropdown for social links.

**Architecture:** `cms` schema + desk + `pnpm typegen` → **migration**
(navItem/socialLink → link; inline the referenced hero link) → `service`
(extend the existing `linkFragment`/`toLink`; rewire nav/footer/home; delete
`navItem`/`socialLink` handling) → `web` (footer maps `link.href`/`platform`).
`@blog/ui` is prop-driven and unchanged.

**Tech Stack:** Sanity v6, `sanity/migrate`, groqd, Next.js 15.

## Key design decision (reuse existing link field names)

The existing `link` document already models internal/external links with fields
`label` / `linkType` (`internal|external`) / `internalReference` (ref to
post|category|page) / `url`, and `linkFragment` + `toLink` already resolve them
to `{ label, href }`. **We keep those field names** (rather than the spec's
`kind`/`reference`/`href`) and just **add `openInNewTab` + `platform`** — this
makes the object conversion near-zero-churn for the service layer. (Deviation
from the spec's illustrative field names, in service of DRY/less migration.)

## Migration check

🔴 **Migration required (highest care this phase).** Converts embedded
`navItem`/`socialLink` array members to `link`, inlines the hero's referenced
`link` document, and retires the `link` document type. Live data must move.

## Prerequisite

Rebase onto `main` **after #256 merges** (the navigation/footer `preview` fix) so
those `preview:` lines are retained when this phase rewrites the singleton
`of: [...]` arrays.

## Layer sequence

`cms` (+typegen) → **migration** → `service` (+tests) → `web` (+tests) → verify.
`ui` NOT invoked.

---

## Task 1 — CMS: `link` object, SOCIAL_PLATFORMS, retire old types

**Files:**

- Create: `apps/cms/src/schema-types/constants/social-platforms.ts`
- Rewrite: `apps/cms/src/schema-types/documents/settings/link.ts` → move to
  `apps/cms/src/schema-types/objects/link.ts` as `type: 'object'`.
- Modify: `objects/index.ts` (register `link`; remove `navItem`, `socialLink`).
- Delete: `objects/nav-item.ts`, `objects/social-link.ts`,
  `documents/settings/link.ts`.
- Modify: `documents/index.ts` (remove the `link` document).
- Modify: `documents/settings/navigation.ts` (`items: link[]`, keep `preview`).
- Modify: `documents/settings/footer.ts` (`social: link[]`, keep `preview`).
- Modify: `documents/pages/home-page.ts` (`secondaryAction` reference → inline
  `link` object).
- Modify: `sanity.config.ts` (remove the "Links" desk entry if present).
- Regenerate types.

- [ ] **Step 1: SOCIAL_PLATFORMS const**
      `apps/cms/src/schema-types/constants/social-platforms.ts`:

```ts
export const SOCIAL_PLATFORMS = [
  { title: 'X (Twitter)', value: 'x' },
  { title: 'GitHub', value: 'github' },
  { title: 'LinkedIn', value: 'linkedin' },
  { title: 'YouTube', value: 'youtube' },
  { title: 'Instagram', value: 'instagram' },
  { title: 'Mastodon', value: 'mastodon' },
  { title: 'Bluesky', value: 'bluesky' },
  { title: 'Facebook', value: 'facebook' },
  { title: 'Threads', value: 'threads' },
  { title: 'RSS', value: 'rss' },
] as const;
```

- [ ] **Step 2: `link` object** — `apps/cms/src/schema-types/objects/link.ts`.
      Same shape as the current `link` document (label / linkType / internalReference
      / url with the existing `hidden`/`validation` rules) but `type: 'object'`,
      plus two new fields:

```ts
    defineField({
      name: 'openInNewTab',
      title: 'Open in new tab',
      type: 'boolean',
      description: 'External links only.',
      hidden: ({ parent }) => (parent as { linkType?: string })?.linkType !== 'external',
      initialValue: false,
    }),
    defineField({
      name: 'platform',
      title: 'Social Platform',
      type: 'string',
      description: 'Set for footer social links — drives the platform icon.',
      options: { list: [...SOCIAL_PLATFORMS] },
    }),
```

Keep the existing `preview` (label + resolved target). Note: `hidden`/
`validation` on an object member read `parent` (the object), not `document` —
adjust the existing `isLinkType(document, …)` helpers to use `parent`.

- [ ] **Step 3: singletons → `link[]`** — in `navigation.ts` set
      `of: [defineArrayMember({ type: 'link' })]` (keep the `preview`); same for
      `footer.ts` `social`.

- [ ] **Step 4: hero secondaryAction → inline link** — in `home-page.ts`, change
      `secondaryAction` from `type: 'reference'` (to `link`) to `type: 'link'`
      (inline object). Keep its `fieldset: 'hero'` and description.

- [ ] **Step 5: retire old types** — delete `nav-item.ts`, `social-link.ts`, the
      `link` document; update `objects/index.ts` (add `link`, remove `navItem`/
      `socialLink`) and `documents/index.ts` (remove `link`); remove the Links desk
      item in `sanity.config.ts` if present.

- [ ] **Step 6: typegen + verify** — `pnpm typegen`, `pnpm --filter cms
type-check`, `pnpm --filter cms lint`. Expect `Link` object type; `NavItem`/
      `SocialLink` gone; `SettingsNavigation.items`/`SettingsFooter.social` now
      `Link[]`; `HomePage.secondaryAction` an inline `Link`.

- [ ] **Step 7: Commit (GATE).**

---

## Task 2 — Migration: navItem/socialLink → link; inline the hero link

**Files:** `apps/cms/migrations/unify-links/index.ts`

Three transforms; the hero one is the hard part (cross-document deref).

- [ ] **Step 1: nav + social (per-document patches).** For `settings_navigation`,
      map each `items[]` `navItem { label, href }` → `link { _type:'link', label,
linkType:'external', url: href }`. For `settings_footer`, map each `social[]`
      `socialLink { platform, url }` → `link { _type:'link', label: platform,
linkType:'external', url, platform: normalize(platform) }`, where
      `normalize` lowercases the free-text platform and matches a `SOCIAL_PLATFORMS`
      value (fallback: leave `platform` unset). These are straightforward
      `at('items', set(...))` / `at('social', set(...))` array rewrites.

- [ ] **Step 2: hero secondaryAction (cross-doc).** `homePage.secondaryAction`
      is a _reference_ to a `link` document; it must become an inline `link` object.
      A `document()` visitor can't read the referenced doc's fields. **Resolve the
      approach via `use-context7`** ("sanity/migrate async client fetch reference"):
      either the client-backed async migration form, or — pragmatic fallback given
      there is a single `homePage` — **re-set `secondaryAction` by hand in Studio**
      after the schema change and handle only nav/social in the migration. Pick the
      fallback unless the client form is clean. Document whichever is chosen.

- [ ] **Step 3:** Optionally `delete` the now-orphaned `link` documents (or leave
      them; they're unreferenced once the hero is inlined). Keep it simple — note in
      the migration.

- [ ] **Step 4:** type-check/lint; present human-gated commands (export → dry →
      run). Do NOT run. Commit (GATE).

---

## Task 3 — Service: one link view-model everywhere

**Files:**

- Add/confirm `ILink` in `@blog/config` (its `src/` index of shared interfaces).
- Modify `packages/service/src/shared/fragments/link.ts` — add `openInNewTab`
  and `platform` to the projection (keep `linkType` for `isExternal`).
- Modify `packages/service/src/shared/transformers/to-link.ts` — return `ILink`
  (from `@blog/config`); drop the local `TLink`.
- Modify `navigation/adaptor/{query,transformer,types}.ts` — project `items[]`
  via `linkFragment`; `toNavigation` maps via `toLink`; `TNavigation.items: ILink[]`.
- Modify `footer/adaptor/{query,transformer,types}.ts` — project `social[]` via
  `linkFragment`; `toFooter` maps via `toLink`; `TFooter.social: ILink[]`.
- Modify `pages/home/adaptor/query.ts` — `secondaryAction` is now an inline
  object: drop the `.deref()`, keep `.project(linkFragment)`. `transformer.ts`
  unchanged (`toLink(rawHome?.secondaryAction)` still works).
- Delete `shared/fragments/social-link.ts` + `shared/transformers/to-social-link.ts`;
  remove `TNavItem` (if unused) — update barrels/`index.ts`.
- Update fixtures/tests.

**Shared view-model — `ILink` in `@blog/config`:**

Promote the link view-model to a shared `ILink` interface in `@blog/config`
(the I-interface home, alongside `ISanityImage`) — **add it if it doesn't
already exist** — so `service` produces it and `apps/web` (and `@blog/ui` if
needed) consume it without importing from `service`. `toLink` returns `ILink`.

```ts
// @blog/config
export interface ILink {
  label: string;
  href: string;
  /** '_blank' for external links that opt into a new tab, else undefined.
   *  The new-tab decision is made HERE, not repeated at every render site. */
  target: '_blank' | undefined;
  /** Social platform key (SOCIAL_PLATFORMS), set on footer social links. */
  platform: string | undefined;
}
```

`toLink` computes:

```ts
target:
  raw.linkType === 'external' && raw.openInNewTab ? '_blank' : undefined,
platform: raw.platform ?? undefined,
```

alongside the existing label/href resolution. The old local `TLink` alias in
`to-link.ts` is replaced by `ILink`. (`linkType`/`openInNewTab` stay
schema/projection fields but collapse into `target` — nothing downstream sees the
raw booleans; the web wrapper keys off `target` and the resolved `href`.)

- [ ] **Step 1: `linkFragment`** — add `openInNewTab: sub.field('openInNewTab')`
      and `platform: sub.field('platform')` to the existing projection.
- [ ] **Step 2: `toLink`** — return `openInNewTab: raw.openInNewTab ?? false`
      and `platform: raw.platform ?? undefined` alongside the existing label/href
      resolution. (`toLink` still returns `undefined` when no href resolves; nav/
      footer transformers `.flatMap` to drop undefined.)
- [ ] **Step 3:** rewire navigation + footer queries/transformers to
      `linkFragment` + `toLink`; update `home` query (drop deref).
- [ ] **Step 4:** delete social-link fragment/transformer; fix barrels; update
      fixtures/tests to the `link` raw shape.
- [ ] **Step 5:** `pnpm --filter @blog/service type-check && lint && test`.
      Commit (GATE).

---

## Task 4 — Web: one `SmartLink` wrapper, consume `ILink`

Put the routing + `target`/`rel` logic in **one** wrapper so it isn't repeated
at every render site.

**Files:**

- Create: `apps/web/src/components/smart-link/smart-link.tsx`
- Modify: `apps/web/src/app/[locale]/layout.tsx` (footer social + header nav)
- Modify: `apps/web/src/app/[locale]/page.tsx` (hero secondary action) if it
  renders a link
- Possibly modify `@blog/ui` link components (see Step 3)

- [ ] **Step 1: the wrapper.** `SmartLink` is a drop-in for the app's link that
      derives `rel` from `target` and picks the right element — the locale-aware
      i18n `Link` for internal paths, a plain `<a>` for absolute (external) URLs:

  ```tsx
  import { Link } from '@/i18n/navigation';
  import type { ComponentPropsWithoutRef } from 'react';

  type TProps = {
    href: string;
    target?: '_blank';
  } & Omit<ComponentPropsWithoutRef<'a'>, 'href' | 'target' | 'rel'>;

  const isAbsolute = (href: string) => /^https?:\/\//.test(href);

  export function SmartLink({ href, target, children, ...rest }: TProps) {
    const rel = target === '_blank' ? 'noopener noreferrer' : undefined;
    if (isAbsolute(href)) {
      return (
        <a href={href} target={target} rel={rel} {...rest}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} {...rest}>
        {children}
      </Link>
    );
  }
  ```

  Server Component (no `'use client'`). `rel` is added only for `_blank`;
  internal links get neither `target` nor `rel`. It takes `href` + `target`
  (not the whole `ILink`) so it also works as a polymorphic `as`/`linkAs`.

- [ ] **Step 2: use it.** In `layout.tsx`, render footer social and header nav
      through `SmartLink`, spreading each `ILink`'s `href`/`target`:
      `<SmartLink href={link.href} target={link.target}>{link.label}</SmartLink>`.
      Where links flow through a `@blog/ui` organism via `linkAs`/`as`
      (`PrimaryNavigation`, `LinkButton`), pass `SmartLink` as that component.

- [ ] **Step 3: `@blog/ui` `target` forwarding.** For links rendered _through_ a
      ui organism, that organism must carry `target` to the `linkAs`/`as` element —
      e.g. `PrimaryNavigation`'s link-item type gains an optional `target`, and
      `NavLink`/`LinkButton` forward `target` via `...rest`. Keep it prop-driven (no
      `'use client'`, no `rel` logic in ui — `rel` lives only in `SmartLink`). This
      is the one place P4 may touch `@blog/ui`; add a story/test per
      `ui-storybook`/`testing-practices` if props change.

- [ ] **Step 4:** `pnpm --filter web type-check && lint` (+ `@blog/ui` if
      touched, with its test). Commit (GATE).

---

## Task 5 — Verify + gates

- [ ] `pnpm typegen && pnpm type-check && pnpm lint && pnpm test` green.
      (`web build` needs SANITY env — CI authoritative. Same deploy-ordering caveat:
      run `unify-links` on production before deploy.)
- [ ] Push + PR gates (separate). PR `refactor(cms): unify links into a single
link object (#242 P4)`, `Closes #249 Refs #242`; set **#249 → Code Review**.

## Self-review

- **Spec coverage:** single `link` everywhere ✔; `openInNewTab` (external) ✔;
  `platform` dropdown ✔; footer social uses `link` ✔; `navItem`/`socialLink`/
  `link`-doc retired ✔. The `_type` naming of remaining docs is Phase 6.
- **Placeholders:** concrete except the flagged hero-inline migration approach
  (context7 / manual fallback) and the platform-normalisation map (best-effort).
- **Type consistency:** `TLink` is the one link view-model across nav/footer/home;
  reused field names keep `linkFragment`/`toLink` changes additive.

## Layers touched (updated)

`config` (add `ILink`) → `cms` (+migration) → `service` → `web`, plus a possible
small `@blog/ui` `target`/`rel` passthrough (Task 4 Step 3). Layer sequence in
§"Layer sequence" gains `config` at the front (the shared `ILink` interface).

## ⚠️ Deploy ordering (same as P2/P3)

The new `link` shape + inlined hero action are expected by the new code — run the
`unify-links` migration on `production` before deploying.
