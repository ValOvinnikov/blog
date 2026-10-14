---
title: Heroes
status: built
layers: [config, studio, service, ui, web]
code:
  - apps/web/src/modules/hero-*/**
  - apps/web/src/utils/resolve-hero-layout/**
  - packages/studio/src/schema-types/modules/hero*/**
  - packages/studio/src/schema-types/fields/hero-*/**
  - packages/studio/src/schema-types/fields/content-position-fields/**
  - packages/studio/src/schema-types/objects/hero-layout/**
  - packages/studio/src/schema-types/validation/validate-pinned-post-translated/**
  - packages/service/src/features/modules/hero*/**
  - packages/service/src/shared/transformers/hero/**
  - packages/ui/src/components/organisms/hero/**
epics: [5016, 5028, 2813, 3430, 3215, 3600, 3527]
---

# Heroes

## What it does

A hero is the optional opening band of a page. It replaces the page's own heading and owns the page's `<h1>`. Editors pick one of three kinds: a **Blog Hero** built around one post (pinned, or the newest marked Featured), a **Statement Hero** with a headline, a supporting line, up to two actions and an image they write themselves, and a **Profile Hero** that introduces a person from the People list. Each lays out as Split (image beside the copy), Stacked (image above or below) or Banner (image as a full-bleed background).

## Surfaces and routes

- **Studio** — Modules → Heroes lists Blog Hero (`module_heroBlog`), Statement Hero (`module_heroStatement`), Profile Hero (`module_heroProfile`) and the deprecated Hero (`module_hero`). A template's **Hero** field is a single reference.
- **Which pages accept which hero** — `template_home` and `template_landing`: Blog, Statement, Profile. `template_postIndex`, `template_topic`, `template_tag`, `template_topicIndex`, `template_tagIndex`: Blog only. Posts have no hero. No template accepts `module_hero`.
- **Public site** — the top of `/`, landing pages, `/blog`, `/topics`, `/topics/[slug]`, `/tags`, `/tags/[slug]` and their paginated pages. On a landing page the hero is the layout's top block, above the section navigation.

## Data

- **Shared hero fields** — `title`, `brandVariant` (all three backgrounds, default Brand tint), `variant` (`SPLIT` default, `STACKED`, `BANNER`), `contentAlignment` (Left/Center/Right, in the Content Position fieldset), `contentPositionSplit` (Left/Right, Split only) or `contentPositionBanner` (Left/Center/Right, Banner only), `mediaOrderSplit` (phone order, Split only), `mediaOrderStacked` (Stacked only; not on Profile), and `layout` (`heroLayout`: spacing top/bottom and dividers, no width).
- **Blog Hero** — `postSource` (`NEWEST_FEATURED` default, or `PINNED` + `post`), optional localized `image` (falls back to the post's hero image), optional `eyebrow` (falls back to the post's topic), `primaryActionLabel` (required in the default language, under 40 characters) and `primaryActionAppearance` (default Contained), optional `secondaryAction`. Heading and supporting text are the post's title and excerpt.
- **Statement Hero** — `headingBlock` (required heading, optional supporting text), optional `eyebrow`, `image` (required for Split and Banner), `ctaButtons` (0–2).
- **Profile Hero** — `headingBlock`, required `author` (`person`), `showRole` (on: the author's role is the eyebrow and the `eyebrow` field hides), `eyebrow`, optional `image`, `ctaButtons`, `showSocialLinks`, `showBio` (all toggles default on).
- **Deprecated `module_hero`** — still registered with its own mode-pair fields and a `service.modules.hero` feature; nothing renders it.
- **Caching** — `modules:<kind>` + `module:<id>` and the tags of what each reads: Blog adds `posts`, `author`, `link`, `topic` and every page-type tag; Profile adds `author`, `link`, `homePage` and `page_landing` only; Statement adds `link` only.

## Configuration

- Editors author heroes in the Studio and choose one per template. Nothing is plan- or capability-gated.
- Look reach: the accent hue paints the Brand tint band and the Banner's brand scrim; radius and fonts restyle the media and heading ([look](./look.md)). Voice does not reach hero copy.

## Constraints and invariants

- Hero membership is the `module_hero` name prefix: `THeroModuleType` and `isHeroModuleType` derive from it, and `toHeroSlot` throws if a template's hero is any other type.
- A page renders exactly one `<h1>`. `renderHeroModule` calls the hero component directly; when it returns nothing (no post resolved, a failed fetch, an unknown type) the page renders its `PageHeading` instead.
- Blog Hero: the pinned post resolves to its translation in the request language; an untranslated pin renders nothing quietly, any other missing post renders nothing and logs `hero_blog_module.post_unresolved`. The Studio blocks publishing Newest featured when no published post is Featured, and warns when a pinned post lacks a translation. The primary action always links to the resolved post.
- Profile Hero image precedence is per variant: Stacked and Split use the module image, else the author's photo; Banner uses the module image or none. Without a photo, Stacked shows initials, Split renders no media and keeps the author's name for assistive technology, Banner shows its scrim band alone. Nothing renders the author's name as copy.
- Banner: the outer `Section` is forced to Plain with no spacing or dividers (`BANNER_SECTION_LAYOUT`); the hero's own spacing sets the Banner height, `brandVariant` tints the image, the image is decorative (`alt=""`) and actions render for a dark ground. Divider fields hide on Banner.
- The shell's 1200×675 image and the Profile Banner image load with `priority`. The Profile Split 900×900 portrait and the Stacked 256×256 avatar load normally.
- `contentPosition` and `mediaOrder` reach the view as single values; `toHeroPresentation` picks the field that matches the variant.

## Dependencies

- Layers: `config` (`HERO_VARIANT`, `POST_SOURCE`, `MEDIA_ORDER`, hero type helpers), `studio`, `service`, `ui` (`Hero` organism with `Avatar`, `Body`, `Cta`, `Media`, `Social` slots), `web` (`HeroModuleShell`, `ActionGroup`, `SanityImage`).
- Features: [module-system](./module-system.md), [page-types](./page-types.md), [posts](./posts.md), [people](./people.md), [links](./links.md), [cta-module](./cta-module.md) (shared CTA buttons), [languages](./languages.md), [look](./look.md), [design-tokens-and-surfaces](./design-tokens-and-surfaces.md), [rendering-and-caching](./rendering-and-caching.md).
- Env: none of its own.

## Entry points

- `apps/web/src/modules/module-renderer.tsx` — `renderHeroModule`
- `apps/web/src/modules/hero-shared/hero-module-shell.tsx`
- `apps/web/src/modules/hero-blog/hero-blog-module.tsx`, `hero-statement/hero-statement-module.tsx`, `hero-profile/hero-profile-module-view.tsx`
- `apps/web/src/utils/resolve-hero-layout/resolve-hero-layout.ts`
- `packages/studio/src/schema-types/fields/hero-field/hero-field.ts`
- `packages/studio/src/schema-types/modules/hero-blog/hero-blog.ts` (and `hero-statement`, `hero-profile`)
- `packages/service/src/features/modules/hero-blog/adaptor/transformer.ts`, `hero-profile/adaptor/transformer.ts`
- `packages/service/src/shared/transformers/hero/to-hero-presentation.ts`
- `packages/ui/src/components/organisms/hero/hero.tsx`

## Tests and stories

- Web: `hero-*-module.test.tsx`, `hero-*-module-view.test.tsx`, `hero-module-shell.test.tsx`, `resolve-hero-layout.test.ts`, and the hero cases in `testing/shared/module-renderer-contract` used by every page renderer test.
- Service: `features/modules/hero*/**/*.test.ts`, `to-hero-presentation.test.ts`, `to-hero-primary-action.test.ts`, `to-module.test.ts`. Studio: `validate-pinned-post-translated.test.ts`, `validate-newest-featured-has-candidate.test.ts`. UI: `hero.test.tsx`.
- Stories: `hero-blog-module-view.stories.tsx`, `hero-statement-module-view.stories.tsx`, `hero-profile-module-view.stories.tsx`, `packages/ui/src/components/organisms/hero/hero.stories.tsx`.

## Related

- #2813 — retire `module_hero` once Blog Hero replaces it on production; #3430 retires its uncalled service feature; #3215 deletes `inlineLink` afterwards.
- #3600 — decide whether author- and post-mediated link targets need precise purging, which would let Blog and Profile drop their page-type tags.
- #5016 — epic: one-entry skins. The Banner recipe renders `data-skin`, and `isOnDark` and tone props go.
- #5028 — epic: text roles. #5033 gives Hero one eyebrow, intro and footnote style.
- #3527 — the Profile Banner backdrop test stops reaching for the image through `container.querySelector`.
