# The post summary

Design of record (epic #7728) for replacing a post page's reading depths with a single
**Summary** disclosure, and the takeaways list with one short rich-text summary.
The mock (https://claude.ai/artifact/WdA29C9cK5jwREXjcw2V5T, version 6, "2
Button") is a visual cross-check, never the only source of a value. Supersedes
#7687's layout fixes; changes what #7614 regenerates.

## Decided (owner, 2026-11-19)

- **No depths.** The post page always shows the full article. The 30s / Read /
  Deep pill, the stored depth and its pre-paint script are removed.
- **No Deep.** Deep never used AI; it revealed editor-written asides already in
  the HTML. Asides now always render inline, as they do in content modules.
- **Summary is a disclosure,** closed by default, that opens a card under the
  author row. The lead, cover and body stay where they are.
- **One rich-text summary,** not a list of takeaways. The model writes it as one
  piece, using a real bullet or numbered list only where the content is a list.

## Reader surface (`apps/web`, `@shinefold/ui`)

- **Who gets it:** a post whose published summary has at least one block with
  text. Any other post shows the article alone, with no button.
- **Button:** in the author row's action group, in this order: Save (only where
  bookmarks are on), Share, Summary. Summary is last, so Tab goes from it
  straight into the card.
  - Same look as Save: bordered, monospaced label, 44px tall below `md`, a
    chevron and no icon. While open it takes Save's highlighted (saved) look.
  - A disclosure: `aria-expanded`, and `aria-controls` naming the card. The
    chevron flips when open. Pressing it again closes the card. Focus stays on
    the button either way.
- **Action group (`@shinefold/ui` `PostMeta`):** the `share` slot becomes
  `actions`. From `sm` up it stays pushed to the row's end, as today. Below
  `sm` it takes its own row and starts at the left edge.
- **Card:** directly under the author row, in the title's column, with the
  heading group's left edge and width at every width.
  - Surface background, strong border, large radius.
  - Header: "Key takeaways", with a quiet "30 sec read" and a clock beside it.
    The time drops under the title when space is tight.
  - Body: the summary's Portable Text: paragraphs, bullet and numbered lists,
    bold and italic. No dividers.
  - Footer: "Read the full article · {N} min" (the existing `readFullArticle`
    copy plus `readingTimeMinutes`). It closes the card and moves focus to the
    start of the article body.
  - Rendered in the server HTML, hidden until opened, so it never flashes and
    needs no stored state. It always starts closed.
- **Keyboard order:** Save, Share, Summary, the card's content, then "Read the
  full article".
- **Crawlers** see the article; the card's text is in the HTML but hidden, as
  before.

## Data (`@shinefold/studio`, `@shinefold/config`, `@shinefold/service`)

- `page_post.postTakeaways` keeps its name and `generatedAt` / `model`.
  `takeaways` (string array) is replaced by **`summary`**, a restricted
  Portable Text array:
  - styles: `normal` only; lists: `bullet` and `number`; decorators: `strong`
    and `em`; no annotations (no links) and no custom blocks;
  - validation: required once the object is set, at most 100 words (so "30 sec
    read" holds at the site's 200 words a minute), at most 8 blocks.
- Studio: the field title becomes "Summary". Preview: "{N} words" or "No
  summary yet". The editor sees and edits exactly what readers get.
- Service: `toPostTakeaways` becomes the summary mapper. A summary with no
  block that has text is treated as none. `TPostDetail.hasAsides` goes once
  the depth system that reads it is removed.
- Pre-launch, so no content migration: the starter content has no takeaways,
  and dev posts with an old `takeaways` value show it as an unknown field until
  regenerated or cleared.

## Generation (`apps/web` skim pipeline)

- Still one Haiku call per generation, the same allowance, triggers, draft-only
  write and checks (`docs/features/skim-pipeline.md`).
- Structured output, not free Markdown: a zod schema of 1–8 blocks, each
  `{ style: PARAGRAPH | BULLET | NUMBER, text }`, with `**bold**` and `*italic*`
  as the only inline marks. Structured output guarantees the shape; a free
  Markdown reply would need a parser and a fallback for anything outside the
  allowed set.
- The prompt asks for at most 100 words in the post's own voice, prose by
  default, and a list only where the content is one.
- The server converts the blocks to Portable Text (consecutive `BULLET` or
  `NUMBER` blocks become one list; marks become `strong` / `em` spans), counts
  words, and refuses (422, claim given back) a reply over 100 words.
- `hasExistingTakeaways` checks for a non-empty `summary`.

## Removed

- `DEPTH`, `DEPTH_STORAGE_KEY`, `DepthProvider`, `depth-script`,
  `DepthToggle`, `SkimPanel`, `SwitchToReadButton` (its job moves to the
  card's footer), `DeepAside`'s depth gating, and the `depthToggle.*` /
  `skimPanel.*` copy. A reader's stored `reading-depth` value is left in their
  browser and never read.
- From #7686: `Article.Header`'s topic-row `action` slot and the `data-slot`
  hooks that let a page hide the lead and cover. In their place
  `Article.Header` takes one generic slot rendered under the meta row, inside
  the heading column, which the card fills.

## Copy — Voice candidates (owner decides tenant-editable or fixed)

|            | EN            | DE               | ES              | FR              | NL              |
| ---------- | ------------- | ---------------- | --------------- | --------------- | --------------- |
| Button     | Summary       | Kurzfassung      | Resumen         | Résumé          | Samenvatting    |
| Card title | Key takeaways | Das Wichtigste   | Puntos clave    | L'essentiel     | Kernpunten      |
| Card time  | 30 sec read   | 30 Sek. Lesezeit | 30 s de lectura | 30 s de lecture | 30 sec leestijd |

## Order

Replacing `takeaways` with `summary` is a rename that the service mapper, the
generation and the card all read, and pre-launch rules out an expand/contract
pair, so that switch is one PR across layers. Everything else ships alone:

1. ui: `PostMeta`'s `share` slot renamed `actions` and wrapped to its own row
   below `sm`; `Article.Header`'s under-meta slot in place of #7686's unused
   parts. The rename reds web's one caller, so that line ships in the same PR.
2. web, reader: the Summary button and card, rendering today's takeaways list
   for now; the depth system removed; asides inline; `hasAsides` no longer
   read. After 1.
3. The summary switch, one branch, each layer by its own agent: studio
   (`summary` field) → `pnpm typegen` → service (summary mapper, `hasAsides`
   dropped) → web (generation schema, prompt and converter; existence check;
   the card renders Portable Text). After 2. Its PR rewrites
   `reading-experience.md` and `skim-pipeline.md`.
4. Manual test.

## Open

- Voice candidates above: tenant-editable or fixed.
- #7614 (regenerate): its Opens stand; it regenerates the summary. Its
  "New takeaways are ready" note becomes "A new summary is ready".
