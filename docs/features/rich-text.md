---
title: Rich text
status: built
layers: [config, studio, service, ui, web]
code:
  - packages/config/src/portable-text/**
  - packages/config/src/constants/portable-text-block-type.ts
  - packages/config/src/constants/aside.ts
  - packages/config/src/constants/image-layout.ts
  - packages/studio/src/schema-types/portable-text/**
  - packages/studio/src/schema-types/objects/aside/**
  - packages/studio/src/schema-types/objects/body-image/**
  - packages/studio/src/schema-types/fields/localized-article-text-field/**
  - packages/studio/src/schema-types/fields/localized-listed-text-field/**
  - packages/studio/src/schema-types/fields/localized-paragraph-text-field/**
  - packages/service/src/shared/fragments/portable-text/**
  - packages/service/src/shared/transformers/portable-text/**
  - packages/service/src/shared/localization/get-localized-article-text/**
  - packages/service/src/shared/localization/get-localized-portable-text-block/**
  - packages/ui/src/components/atoms/prose/**
  - packages/ui/src/components/atoms/text-link/**
  - packages/ui/src/components/atoms/inline-code/**
  - packages/ui/src/components/atoms/quote-block/**
  - packages/ui/src/components/molecules/aside/**
  - packages/ui/src/components/molecules/image-with-caption/**
  - apps/web/src/components/shared/portable-text/**
  - apps/web/src/testing/shared/portable-text/**
  - packages/studio/src/schema-types/objects/expandable-section/**
  - packages/studio/src/schema-types/objects/table/**
  - packages/studio/src/schema-types/validation/validate-table-column-count/**
  - packages/config/src/constants/table.ts
  - packages/studio/src/schema-types/objects/cookie-list/**
  - packages/studio/src/schema-types/objects/cookie-preferences-link/**
  - packages/studio/src/schema-types/portable-text/expandable-section-text/**
  - packages/ui/src/components/molecules/table/**
  - apps/web/src/constants/cookie-list.ts
epics: [4987, 2788, 6505]
---

# Rich text

## What it does

Editors write formatted text in Sanity's Portable Text editor, and the public site renders it with one shared renderer. Three shapes exist, each allowing only what its place needs: a full article body (headings, quotes, bullet and numbered lists, images, code, asides, expandable sections, tables, the cookie list and cookie-preferences links), short text with lists, and plain paragraphs. Links inside text always point at a reusable link document. The same renderer serves the post body, every module that carries formatted text, and Voice rich values on the public site (through `VoiceRichText`).

## Surfaces and routes

- **Studio:** the post's `content`; a privacy or legal page's and the cookie statement's `content` (./footer-and-legal-pages.md); the content module's `body`; the CTA module's `content`, the FAQ block's `answer` and a feature highlight's `body` and a testimonial's `quote` (listed text); a person's `bio`, a timeline item's `body` and an aside's `body` (paragraph text).
- **Public site:** `/blog/{slug}` (post body, inside `Prose`), `/privacy/{slug}`, `/legal/{slug}` and `/legal/cookie-statement`, and the content, CTA, FAQ, feature-highlights, hero-profile, team, testimonial and timeline modules wherever a page places them.
- **Platform:** none. Voice's rich fields use their own schema and editor (./voice.md), though the public site renders them with this renderer; emails serialise Portable Text with their own HTML serialiser (./email.md).

## Data

- **Studio types:** `articleText` (styles Normal, H2, H3, H4, Quote; decorators bold, italic, code, underline, strike, subscript, superscript; bullet and numbered lists (Sanity defaults); members `block`, `bodyImage`, `code`, `aside`, `cookieList`, `expandableSection`, `table`; annotations `linkRef` and `cookiePreferencesLink`), `listedText` (Normal only; bold, italic, sub, sup; bullet and numbered lists), `paragraphText` (as `listedText` with no lists). All three take the `linkRef` annotation (a reference to a `link` document, ./links.md).
- **Objects:** `aside` (`kind` from `ASIDE_KIND`: `WHY_NOT`, `DIGRESSION`, `CONTEXT`; `body` as `paragraphText`), `bodyImage` (image with hotspot, `alt`, optional `layout` from `IMAGE_LAYOUT`: `INLINE`, `FULL_BLEED`, `FLOAT_LEFT`, `FLOAT_RIGHT`), and `code` from `@sanity/code-input` (`code`, `language`, `highlightedLines`).
- **Legal blocks:** `expandableSection` (`title`, required; `body` as `expandableSectionText` — `articleText`'s blocks and embeds, styles Normal, H4 and Quote (H4 only, so its headings sit below the section's H3-styled title), no nested section or table); `table`, Sanity's Portable Text table (`headerRows`, `rows[].cells[].value`, each cell Normal text with bold, italic and `linkRef`; no caption); `cookieList`, a marker with no editable field; `cookiePreferencesLink`, an annotation with no field whose label is the selected text.
- **Localisation:** the post body is a plain `articleText` (each post is one language). Module and document fields use `internationalizedArrayArticleText`, `…ListedText` or `…ParagraphText`, read with `getLocalizedArticleText` / `getLocalizedPortableTextBlock`, which fall back from the request language to the default language.
- **Service shape:** `portableTextBodyItemFragment` projects blocks with their `markDefs` dereferenced to the link document, body images with their layout, and aside bodies; `toPortableTextBody` returns `TPortableTextBody`. A link mark becomes `IPortableTextLinkMark` with a resolved `{ href, target }`, or `link: undefined` when the link document is gone.
- **Cache:** none of its own; it rides the query of the page or module that carries it (./rendering-and-caching.md).

## Configuration

- Editors choose the content inside the shapes; which shape a field uses is fixed in the schema.
- Not plan-gated. Look reaches it through tokens: prose sizes, link and quote colours, the aside and code-block surfaces (`--code-*` properties in `apps/web/index.css`, light and dark). See ./look.md and ./design-tokens-and-surfaces.md.
- Aside labels in the post body are fixed catalog copy (`blogPostPage.asideKind.*`), not Voice.

## Constraints and invariants

- An expandable section allows H3 and below only, so the contents rail, built from the page's H2s, stays accurate. It renders as a single `Accordion` item, an item card closed by default, with a nested renderer.
- A table renders `@blog/ui`'s `Table`: its first `headerRows` rows as header cells, the rest as body rows, in a scrolling region named by the fixed `table.regionLabel`. Columns size to their content, and a non-empty cell keeps a 10-character floor. Edge shadows show on whichever side has more table to scroll. The table's outer border takes its corners from the radius scale (`rounded-card`), and the header row's fill follows those corners, including a table of header rows only. From `lg`, a table widens past the text measure (`FULL_BLEED_TABLE`): with a contents rail it fills the column beside the rail; without one it takes the page width minus the gutters; in a content module it fills the section. Below `lg` it keeps the text width and scrolls. The Studio warns when a row has `TABLE_COLUMN_WARNING_THRESHOLD` (five) or more cells, and publishing is never blocked. Tables are entered in the Studio; paste from outside the Studio is not supported (#6914, #6915).
- The cookie list renders from code, never from editor text: `COOKIE_LIST` in `apps/web/src/constants/cookie-list.ts` names every cookie and storage key the site sets, with a purpose and duration per id under the fixed `cookieList.*` catalog keys. Three columns (name, purpose, duration) from `sm` up; stacked entries on phones.
- The cookie-preferences link renders a `button` styled as a prose link that opens the consent preferences dialog (./consent-and-analytics.md).
- `articleText` has no H1, so the body never competes with the page title. A stored `h1` block still renders, as a level-2 heading without an anchor.
- H2 and H3 render with `id={block._key}` and scroll margins that clear the sticky header and the mobile contents bar; the contents rail links to those ids (./reading-experience.md).
- Marks: `code` → `InlineCode`, `sub`/`sup` → native elements, `linkRef` → `TextLink` (`appearance="prose"`) rendered as `SmartLink`. The link is always underlined in its own colour: 1px at rest, 2px on hover. A link whose document was deleted renders its text unlinked. Bold, italic, underline and strike use `@portabletext/react` defaults.
- Blocks: `blockquote` → `QuoteBlock`; bullet and numbered lists → `ul`/`ol`.
- Below `lg` the `Prose` container takes the text measure (`proseMeasureCapSlot`) and centres, so its `ch` resolves at the prose text size and headings, paragraphs, tables and expandable sections share one width and left edge. From `lg` each block is capped to the measure instead, left-aligned in its column.
- `bodyImage` renders `ImageWithCaption` around `SanityImage` (1200px wide, lazy) and renders nothing without an asset. Floats apply from `lg` only, at 12rem; `FULL_BLEED` is wrapped in `data-full-bleed` so `proseMeasureCapSlot` leaves it uncapped.
- `code` renders `CodeBlock`, which wraps `react-syntax-highlighter` (Prism) with line numbers, highlighted lines and `text` as the default language. It lives in `apps/web` because `@blog/ui` takes no third-party highlighter. The Studio code input does not offer a filename, so the filename caption only shows for data that carries one. The scrolling `<pre>` is a keyboard-focusable region named by the fixed `codeBlock.regionLabel` message, with an inset focus ring so the figure's `overflow-hidden` cannot clip it.
- `aside` renders `DeepAside` with a nested renderer that has no aside type, so asides never nest. Inside a post it shows only at the Deep depth; elsewhere it always shows. Only the post article passes kind labels (`createAsideOverride`); other surfaces label an aside with its raw kind value.
- `PortableText` merges caller overrides over `baseComponents`; there is one renderer, and modules never define their own.
- Reading time counts only top-level text blocks (./reading-experience.md); the skim prompt reads only text blocks too (./skim-pipeline.md).

## Dependencies

- Layers: `@blog/config` (types, constants, generated `ArticleText`/`ListedText`/`ParagraphText`), `@blog/studio`, `@blog/service`, `@blog/ui`, `apps/web`; `@portabletext/react`, `react-syntax-highlighter`, `@sanity/code-input`.
- Features: ./links.md, ./reading-experience.md, ./posts.md, ./content-module.md, ./cta-module.md, ./faq-module.md, ./feature-highlights-module.md, ./timeline-module.md, ./team-module.md, ./testimonial-module.md, ./heroes.md, ./people.md, ./languages.md, ./studio-authoring.md.
- Env: none.

## Entry points

- `packages/studio/src/schema-types/portable-text/article-text/article-text.ts`, `listed-text/listed-text.ts`, `paragraph-text/paragraph-text.ts`, `decorators/decorators.ts`
- `packages/studio/src/schema-types/objects/aside/aside.ts`, `objects/body-image/body-image.ts`
- `packages/service/src/shared/fragments/portable-text/portable-text-body-item.ts`
- `packages/service/src/shared/transformers/portable-text/to-portable-text-body.ts`, `to-portable-text-mark-def.ts`
- `apps/web/src/components/shared/portable-text/portable-text.tsx` and `config/{block,list,marks,types,full-bleed}.ts(x)` (`full-bleed.ts` holds `FULL_BLEED_TABLE`)
- `apps/web/src/components/shared/portable-text/components/code-block/code-block.tsx`
- `apps/web/src/components/shared/portable-text/config/cookie-list.tsx`, `cookie-preferences-link.tsx`
- `packages/studio/src/schema-types/objects/expandable-section/expandable-section.ts`, `table/table.ts`, `cookie-list/cookie-list.ts`, `cookie-preferences-link/cookie-preferences-link.ts`
- `packages/studio/src/schema-types/validation/validate-table-column-count/validate-table-column-count.ts`

## Tests and stories

- `apps/web/src/components/shared/portable-text/portable-text.test.tsx`, `config/cookie-list.test.tsx`, `config/cookie-preferences-link.test.tsx`, `code-block.test.tsx`, `code-block-syntax-theme.test.ts`; story `code-block.stories.tsx`.
- `packages/service/src/shared/transformers/portable-text/*.test.ts`, `get-localized-portable-text-block.test.ts`.
- `packages/studio/src/schema-types/portable-text/to-plain-text/to-plain-text.test.ts`.
- `packages/ui`: tests and stories beside `prose`, `text-link`, `inline-code`, `quote-block`, `aside`, `image-with-caption` and `heading`.

## Related

- #4987 epic: accessible, correctly rendered text and colour on the public site.
  - #5008 a scrolling code block can be focused and is named.
  - #4989 prose-sized headings keep their text colour.
- #6505 epic: the expandable section, table, cookie list and cookie-preferences link (manual test #6533).
- #2788 epic: embeds. #3775, #3776 and #3777 add an embed block to the post body (studio, service, web).
