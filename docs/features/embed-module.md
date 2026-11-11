---
title: Embed module
status: planned
layers: [config, studio, service, ui, web]
code:
  - packages/config/src/embed/**
  - packages/config/src/constants/embed.ts
  - packages/config/src/constants/media-ratio.ts
  - packages/config/src/types/embed.ts
  - packages/studio/src/schema-types/objects/embed/**
  - packages/studio/src/schema-types/modules/embed/**
  - packages/studio/src/schema-types/fields/embed-url-field/**
  - packages/studio/src/schema-types/validation/validate-embed-url/**
  - packages/ui/src/components/molecules/consent-placeholder/**
  - packages/config/src/constants/consent-category.ts
  - apps/web/src/hooks/use-consent/**
epics: [2788, 3771, 3772, 3773, 3774, 3775, 3776, 3777, 3778]
---

# Embed module

## What it does

Editors will place a video, a booking calendar or a map on a page as its own section, or inside a post between paragraphs. The site never loads the third party until the visitor allows External media; until then a placeholder of the right shape stands in. The parser, the Studio `embed` object and `module_embed` exist; nothing renders an embed on the site yet. The consent half it depends on is built: the External media category, the consent store and hooks, and the `ConsentPlaceholder` component.

## Surfaces and routes

- **Public site** — a planned `module_embed` section on Home and Landing pages, and a planned `embed` block in the post body.
- **Studio** — `module_embed` (title "Embed") under Modules → Explainers, allowed on `template_home` and on the landing layout template, so Landing, Legal index and Privacy index pages all offer it. The post-body `embed` block is planned.
- **Platform** — nothing.

## Data

- **`embed` object** (`embedObjectSchema`): **URL** (`embedUrlField()`: required, http(s), accepted only when `parseEmbedUrl` accepts it; otherwise "`<host>` can't be embedded. Use a link from YouTube, Vimeo, Loom, Cal.com or Google Maps."), **Title** (localised, required in the default language; the iframe `title` and the placeholder heading), **Caption** (localised, optional; a `<figcaption>`).
- **`module_embed`**: `title`, `brandVariant`, the required `headingBlock`, `embed` (required), `ctaButtons`, `contentAlignment` (Left/Center) and `layout`. One embed per module.
- The planned post-body block keeps plain-field Title and Caption, because a post is one language per document, and reuses `embedUrlField()`.
- Planned service view model: `{ title, caption?, provider, embedUrl, ratio }`.
- Content is Sanity-only; no Neon data. Caching follows the module and post loaders' tags.

## Configuration

- **Editor** — chooses URL, title, caption and, in the module, heading, buttons, alignment and layout. The ratio is never a field.
- **Plan** — `module_embed` is in `MODULE_PACK.CORE`, so every plan can place it.
- **Visitor** — External media consent, from the placeholder, the banner or the footer's Cookie settings.
- **Voice** — `ConsentPlaceholder` takes its message, allow label and scope note as props, and no catalog key exists for them yet (`consent.*` holds only the banner, preferences, categories and footer settings label). The placeholder strings are new copy still to be classified Voice or fixed.

## Constraints and invariants

- **Providers come from the URL**, and only five: YouTube (served from `youtube-nocookie.com`; Shorts shown vertical), Vimeo, Loom, Cal.com and Google Maps "Embed a map" links. Iframes only; the site never loads a provider's script. Google Maps short links are not supported.
- **One parser in `@blog/config`** turns a URL into `{ provider, embedUrl, ratio }`, keeping a start time (`t=`). Studio validation and the service share it, so what an editor can save is exactly what the site can render. A stored URL the parser no longer accepts drops the embed rather than rendering a broken frame.
- **Ratios by provider:** video providers `video` (16:9); Shorts `vertical` (9:16, a new `MediaFrame` ratio — today it offers `video`, `square`, `portrait`, `classic`); Google Maps `classic` (4:3); Cal.com `portrait` (3:4).
- **Consent first.** An `EmbedFrame` in `apps/web` gates the iframe on External media through a shared `ConsentGate` (`apps/web/src/components/shared/consent-gate/`), which does not exist yet and arrives with the web module step, with `ConsentPlaceholder` as the fallback. Allowing grants the whole category, so every embed on the page loads at once. While consent is unknown it renders a neutral box of the right ratio, and no provider URL appears in the static HTML.
- **Iframe hardening:** `loading="lazy"`, `referrerpolicy="strict-origin-when-cross-origin"`, `sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"` (plus `allow-forms` for Cal.com), `allow` limited to `fullscreen; encrypted-media` for video. No autoplay.
- **CSP.** `apps/web`'s policy has no `frame-src`, so `default-src 'self'` blocks every third-party frame today; it must gain exactly the five provider origins.
- **Width.** Not decided: the epic describes a module `size` (Text width, about 580px, by default, or Wide); the ticket uses `layout.containerWidth` with Narrow as the text measure. The module ships with `layout` and no starting width until the decision lands in #2788. The frame follows the module's alignment. In the post body an embed always takes the column width. Shorts stay a centred frame of about 320px.
- Video structured data, autoplay, playlists and several embeds per module are out of scope.

## Dependencies

- Layers: `config` (parser, `EMBED_PROVIDER`, `MEDIA_RATIO`), `studio`, `service`, `ui` (`MediaFrame` vertical ratio), `web` (`ConsentGate`, `EmbedFrame`, module view, page maps, CSP, post-body renderer).
- Features: ./consent-and-analytics.md (the gate), ./module-system.md, ./rich-text.md (the post-body block), ./posts.md, ./cta-module.md (shared CTA buttons), ./location-module.md (reuses these rules for its map), ./rendering-and-caching.md.
- Env vars: none.

## Entry points

What exists today:

- `packages/config/src/embed/parse-embed-url.ts` (`parseEmbedUrl`), `youtube-embed.ts`
- `packages/config/src/constants/embed.ts` (`EMBED_PROVIDER`), `media-ratio.ts` (`MEDIA_RATIO`), `packages/config/src/types/embed.ts` (`TParsedEmbed`)
- `packages/studio/src/schema-types/objects/embed/embed.ts`, `modules/embed/embed.ts`, `fields/embed-url-field/embed-url-field.ts`, `validation/validate-embed-url/validate-embed-url.ts`
- `packages/config/src/constants/consent-category.ts` (`EXTERNAL_MEDIA`)
- `packages/ui/src/components/molecules/consent-placeholder/consent-placeholder.tsx`
- `packages/ui/src/components/atoms/media-frame/media-frame-variants.ts`
- `apps/web/src/hooks/use-consent/use-consent.ts`, `apps/web/src/hooks/use-consent-store/use-consent-store.ts`
- `apps/web/next.config.ts` (the CSP)

## Tests and stories

`consent-placeholder.test.tsx` and `consent-placeholder.stories.tsx` in `@blog/ui`; `use-consent.test.tsx` and `use-consent-store.test.tsx` in `apps/web`; `parse-embed-url.test.ts` in `@blog/config` and `validate-embed-url.test.ts` in `@blog/studio`.

## Related

- #2788 — embeds epic (design of record).
- #3771 — parser, `embed` object and `module_embed`; #3772 — module loader; #3773 — `MediaFrame` vertical ratio; #3774 — render behind the consent gate; #3775 — post-body block; #3776 — post-body projection; #3777 — post-body renderer.
- #3778 — video structured data for embedded videos.
