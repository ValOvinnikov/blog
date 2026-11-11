---
title: Embed module
status: partial
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
  - apps/web/src/components/shared/consent-gate/**
  - apps/web/src/components/shared/embed-frame/**
  - apps/web/src/modules/embed/**
  - apps/web/src/constants/embed.ts
  - apps/web/next.config.ts
epics: [2788, 3771, 3772, 3773, 3774, 3775, 3776, 3777, 3778]
---

# Embed module

## What it does

Editors place a video, a booking calendar or a map on a page as its own section, and will place one inside a post between paragraphs. The site never loads the third party until the visitor allows External media; until then a placeholder of the right shape stands in. The module is built end to end; the post-body block is planned.

## Surfaces and routes

- **Public site** — a `module_embed` section on Home, Landing, Legal index and Privacy index pages (the last two share the landing renderer), and a planned `embed` block in the post body.
- **Studio** — `module_embed` (title "Embed") under Modules → Explainers, allowed on `template_home` and on the landing layout template, so Landing, Legal index and Privacy index pages all offer it. The post-body `embed` block is planned.
- **Platform** — nothing.

## Data

- **`embed` object** (`embedObjectSchema`): **URL** (`embedUrlField()`: required, http(s), accepted only when `parseEmbedUrl` accepts it; otherwise "`<host>` can't be embedded. Use a link from YouTube, Vimeo, Loom, Cal.com or Google Maps."), **Title** (localised, required in the default language; the iframe `title` and the placeholder heading), **Caption** (localised, optional; a `<figcaption>`).
- **`module_embed`**: `title`, `brandVariant`, the required `headingBlock`, `embed` (required), `ctaButtons`, `contentAlignment` (Left/Center) and `layout`, whose container width starts at Narrow. One embed per module.
- The planned post-body block keeps plain-field Title and Caption, because a post is one language per document, and reuses `embedUrlField()`.
- Service view model (`TEmbedModule`, `service.modules.embed.v1.getEmbedModule`): `brandVariant`, `headingBlock`, `embed`, `ctaButtons`, `contentAlignment` and `layout`, where `embed` is `TEmbed` — `{ title, caption, provider, embedUrl, ratio }`, the last three from `parseEmbedUrl` — or `undefined` when the stored URL no longer parses. The post-body block's projection is planned.
- Content is Sanity-only; no Neon data. The module loader tags `modules:embed`, `module:<id>` and the CTA link-target tags; the post body follows the post loader's tags.

## Configuration

- **Editor** — chooses URL, title, caption and, in the module, heading, buttons, alignment and layout. The ratio is never a field.
- **Plan** — `module_embed` is in `MODULE_PACK.CORE`, so every plan can place it.
- **Visitor** — External media consent, from the placeholder, the banner or the footer's Cookie settings.
- **Voice** — the placeholder's allow label and scope note are `consent.placeholder.allowLabel` and `consent.placeholder.scopeNote`, fixed keys like the rest of `consent.*`; its settings label reuses `consent.footerSettingsLabel`. Its message is the embed's Title, and the provider name comes from `EMBED_PROVIDER_NAME` (`apps/web/src/constants/embed.ts`).

## Constraints and invariants

- **Providers come from the URL**, and only five: YouTube (served from `youtube-nocookie.com`; Shorts shown vertical), Vimeo, Loom, Cal.com and Google Maps "Embed a map" links. Iframes only; the site never loads a provider's script. Google Maps short links are not supported.
- **One parser in `@blog/config`** turns a URL into `{ provider, embedUrl, ratio }`, keeping a start time (`t=`). Studio validation and the service share it, so what an editor can save is exactly what the site can render. A stored URL the parser no longer accepts drops the embed rather than rendering a broken frame.
- **Ratios by provider:** video providers `video` (16:9); Shorts `vertical` (9:16, a `MediaFrame` ratio; a Short's frame is centred and capped at about 320px); Google Maps `classic` (4:3); Cal.com `portrait` (3:4).
- **Consent first.** `EmbedFrame` (`apps/web/src/components/shared/embed-frame/`) is a server-rendered `<figure>`; its client `EmbedGate` gates the iframe on External media through the shared `ConsentGate`, with `ConsentPlaceholder` as the fallback and the caption as its `<figcaption>`. Allowing grants the whole category, so every embed on the page loads at once, without a reload. While consent is unknown — the server render included — it renders a neutral `MediaFrame` of the right ratio, so no iframe is rendered and no request goes to the provider before consent. The guarantee is that narrower one: the provider URL may travel in the page's React Server Components payload, which issues no request. Pressing Allow moves focus to the player that replaced the button; a player shown on load never takes focus. Withdrawing consent removes every player.
- **Iframe hardening:** `loading="lazy"`, `referrerpolicy="strict-origin-when-cross-origin"`, `sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"` (plus `allow-forms` for Cal.com), `allow` limited to `fullscreen; encrypted-media` for video. No autoplay.
- **CSP.** `apps/web`'s policy has a `frame-src` of exactly the five provider origins, read from `EMBED_ORIGIN` in `@blog/config` — the same const the parser builds its embed URLs from, so the two cannot drift. `next.config.ts` imports `@blog/config/constants/embed` directly, because Next's config transpiler cannot resolve the constants barrel's aliased imports.
- **Width.** The module's width is `layout.containerWidth`; a new module starts at Narrow, which caps the figure at `max-w-measure` at `text-prose` size — the post column's width and the module heading's — and an editor can widen it, when the figure fills the section. There is no `size` field. The frame follows the module's alignment (centred alongside a centred heading). A module whose embed no longer parses renders nothing.
- Video structured data, autoplay, playlists and several embeds per module are out of scope.

## Dependencies

- Layers: `config` (parser, `EMBED_PROVIDER`, `MEDIA_RATIO`), `studio`, `service`, `ui` (`MediaFrame` vertical ratio), `web` (`ConsentGate`, `EmbedFrame`, module view, page maps, CSP; the post-body renderer is planned).
- Features: ./consent-and-analytics.md (the gate), ./module-system.md, ./rich-text.md (the post-body block), ./posts.md, ./cta-module.md (shared CTA buttons), ./location-module.md (reuses these rules for its map), ./rendering-and-caching.md.
- Env vars: none.

## Entry points

- `packages/config/src/embed/parse-embed-url.ts` (`parseEmbedUrl`), `youtube-embed.ts`
- `packages/config/src/constants/embed.ts` (`EMBED_PROVIDER`, `EMBED_ORIGIN`), `media-ratio.ts` (`MEDIA_RATIO`), `packages/config/src/types/embed.ts` (`TParsedEmbed`)
- `packages/studio/src/schema-types/objects/embed/embed.ts`, `modules/embed/embed.ts`, `fields/embed-url-field/embed-url-field.ts`, `validation/validate-embed-url/validate-embed-url.ts`
- `packages/service/src/features/modules/embed/` (`getEmbedModule`, `toEmbedModule`)
- `packages/config/src/constants/consent-category.ts` (`EXTERNAL_MEDIA`)
- `packages/ui/src/components/molecules/consent-placeholder/consent-placeholder.tsx`
- `packages/ui/src/components/atoms/media-frame/media-frame-variants.ts`
- `apps/web/src/hooks/use-consent/use-consent.ts`, `apps/web/src/hooks/use-consent-store/use-consent-store.ts`
- `apps/web/src/components/shared/consent-gate/consent-gate.tsx`, `apps/web/src/components/shared/embed-frame/embed-frame.tsx`
- `apps/web/src/modules/embed/embed-module.tsx`, `embed-module-view.tsx`; `HOME_MAP` and `LANDING_MAP` entries
- `apps/web/next.config.ts` (the CSP)

## Tests and stories

`consent-placeholder.test.tsx` and `consent-placeholder.stories.tsx` in `@blog/ui`; `use-consent.test.tsx` and `use-consent-store.test.tsx` in `apps/web`; `parse-embed-url.test.ts` in `@blog/config`; `validate-embed-url.test.ts` in `@blog/studio`; the embed module's `query`, `transformer` and `loader` tests in `@blog/service`; `consent-gate.test.tsx`, `embed-frame.test.tsx`, `embed-module.test.tsx`, `embed-module-view.test.tsx` and `embed-module-view.stories.tsx` in `apps/web`.

## Related

- #2788 — embeds epic (design of record).
- #3771 — parser, `embed` object and `module_embed`; #3772 — module loader; #3773 — `MediaFrame` vertical ratio; #3774 — render behind the consent gate; #3775 — post-body block; #3776 — post-body projection; #3777 — post-body renderer.
- #3778 — video structured data for embedded videos.
