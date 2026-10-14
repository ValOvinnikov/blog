---
title: Links
status: built
layers: [config, studio, service, web]
code:
  - packages/config/src/constants/link.ts
  - packages/studio/src/schema-types/documents/link/**
  - packages/studio/src/schema-types/objects/link-ref/**
  - packages/studio/src/schema-types/objects/inline-link/**
  - packages/service/src/shared/fragments/link/**
  - packages/service/src/shared/transformers/link/**
  - apps/web/src/components/shared/smart-link/**
epics: [3215, 3600, 3663]
---

# Links

## What it does

A link is authored once, as a `link` document — a label per language and exactly one destination, either a page of the site or an outside web address — and every place that links points at it: header navigation, footer and person social profiles, CTA and hero buttons, feature cards, logo tiles, testimonial names, person profile pages and body-text annotations. Editing the link document updates every surface at once. A link that cannot be resolved is left out, or rendered as plain text in prose, never as a dead anchor.

## Surfaces and routes

- **Studio:** Blocks → Links lists the `link` documents. They are picked through `linkRef` (navigation items and the link annotation of `articleText`, `listedText` and `paragraphText`), `ctaButton` and `ctaSecondaryButton` (adding `variant` and `appearance`), `socialProfile` (adding `platform`), and plain references on `block_feature.link`, `block_testimonial.link`, `logoItem.link` and `person.profilePage`. A `link` document whose internal target lacks a live translation shows a notice naming those languages and saying their readers go to the default-language page.
- **Public site:** no route of its own. Resolved links render through `SmartLink`.
- **Platform:** none.

## Data

- **`link` document:** `title` (Studio-only), `label` (`internationalizedArrayString`), `linkType` (`INTERNAL` or `EXTERNAL` from `LINK_TYPE`, initial `INTERNAL`), `internalReference` (a reference to one of `LINK_PAGE_TYPES`: `page_home`, `page_landing`, `page_post`, `page_postIndex`, `page_topic`, `page_topicIndex`, `page_tag`, `page_tagIndex`), `url` (`internationalizedArrayString`), `openInNewTab` (initial `false`, shown for external links only).
- **Domain shape:** `ILink` (`@blog/config`) — `label`, `href`, `target`, `platform`, `ariaLabel`.
- **Resolution** (`linkDocumentFragment` → `toLinkDocument`): `label` and `url` take the request language, else the default language. An internal reference follows `translation.metadata` to the target's translation in the request language, else in the default language, else the referenced page itself; `pageHref(type, slug)` (`@blog/config` `routes.ts`) turns it into a path, with a landing page's nested path built by `PAGE_PATH_EXPRESSION`. `target` is `_blank` only for an external link with `openInNewTab`. This path never sets `platform` or `ariaLabel`.
- **Legacy:** `inlineLink`, an object holding its own label and destination, survives only as `module_hero.secondaryAction`, resolved by `inlineLinkFragment` → `toLink`.
- **Cache:** every loader that projects link documents lists `link` and the page types in its `isr(...)` tags; the publish webhook maps `link` → `link`, and also purges the `module:<id>` tag of any module that references a changed document directly or through a `link` document.

## Configuration

- **Editors** create and edit link documents in Studio and pick them wherever a link is offered. Labels and external addresses are per language; a missing language falls back to the default language's value.
- No plan gating, and no platform setting. Look decides how each surface styles its links; Voice does not reach link labels.

## Constraints and invariants

- A destination lives only on the `link` document. Wrapping objects add only what their surface needs and never a destination of their own.
- `label` needs a value in at least one language, each at most 60 characters. An internal link needs `internalReference`; an external link needs a `url` in at least one language, and every `url` must be an absolute `http(s)` address with a host.
- Topics and tags are not link targets themselves; a link goes to their Topic or Tag Page.
- No label, or no href (a slugged page without a slug, an unroutable landing page, a dangling reference), yields no link: navigation items, social profiles, CTA buttons and cards drop it, and a body-text annotation renders its text unlinked.
- Prose offers no paste-a-URL annotation: the only annotation is `linkRef`. In prose the visible text is the annotated span; everywhere else it is the link's label.
- An internal link never 404s for language reasons: it goes to the reader's translation when one exists, else to the default-language page.
- Accessible names come from the link's content (its label, or the card or logo it wraps); a social link's comes from its platform via the catalog. `ILink.ariaLabel` is never populated on the `link` document path.
- `SmartLink` is the only in-app link component: it renders next-intl's `Link`, which adds the current language's prefix to internal paths, falls back to `next/link` for protocol-relative `//host` hrefs, and adds `rel="noopener noreferrer"` to `target="_blank"`.

## Dependencies

- Layers: `config` (`LINK_TYPE`, `ILink`, `routes`/`pageHref`), `studio` (schemas, notices), `service` (resolution), `web` (`SmartLink` and every renderer).
- Features: ./languages.md (translation follow-through, fallbacks), ./navigation.md, ./footer-and-legal-pages.md, ./people.md, ./cta-module.md, ./heroes.md, ./feature-list-module.md, ./logo-wall-module.md, ./testimonial-module.md, ./rich-text.md, ./page-types.md, ./landing-tree.md, ./rendering-and-caching.md.
- Env: none of its own.

## Entry points

- `packages/studio/src/schema-types/documents/link/link.ts`, `link-page-types.ts`
- `packages/studio/src/schema-types/objects/link-ref/link-ref.ts`
- `packages/service/src/shared/fragments/link/link-document.ts`
- `packages/service/src/shared/transformers/link/to-link-document.ts`
- `packages/service/src/shared/localization/translated-reference/translated-reference.ts`
- `packages/config/src/routes.ts` (`pageHref`)
- `packages/studio/src/schema-types/inputs/localization-notice-input/untranslated-target.ts`
- `apps/web/src/components/shared/smart-link/smart-link.tsx`
- `apps/web/src/server/revalidate/resolve-referencing-module-tags/resolve-referencing-module-tags.ts`

## Tests and stories

- `packages/service/src/shared/fragments/link/*.test.ts`, `packages/service/src/shared/transformers/link/*.test.ts`
- `packages/config/src/routes.test.ts`
- `packages/studio/src/schema-types/inputs/localization-notice-input/untranslated-target.test.ts`
- `apps/web/src/components/shared/smart-link/smart-link.test.tsx`, `apps/web/src/server/revalidate/resolve-referencing-module-tags/resolve-referencing-module-tags.test.ts`
- Stories: links render inside `apps/web/src/components/shared/action-group/action-group.stories.tsx`, `social-links/social-links.stories.tsx` and `site-navigation/site-navigation.stories.tsx`; `link` itself has none.

## Related

- #3663 — remove the unused `ILink.ariaLabel`.
- #3215 — delete `inlineLink` once `module_hero` is retired (blocked by #2813).
- #3600 — decide purge coverage for author- and post-mediated hero link targets.
