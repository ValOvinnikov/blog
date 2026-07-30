import type { RichText } from '@blog/config';

/** A post needs at least this many H2 headings before a table-of-contents rail earns its place. */
export const MIN_H2_HEADINGS_FOR_RAIL = 3;

type TPostHeadingLevel = 2 | 3;

export type TPostHeading = {
  /** Stable, URL-safe slug — also the rendered heading's DOM `id` (wired by `PortableTextRenderer`). */
  id: string;
  text: string;
  level: TPostHeadingLevel;
  /** The source block's Portable Text `_key` — lets `PortableTextRenderer` match its own render of this block back to this id without re-deriving the slug. */
  key: string;
};

type TRichTextBlock = Extract<RichText[number], { _type: 'block' }>;

const isHeadingBlock = (
  node: RichText[number],
): node is TRichTextBlock & { style: 'h2' | 'h3' } =>
  node._type === 'block' && (node.style === 'h2' || node.style === 'h3');

const blockText = (block: TRichTextBlock): string =>
  (block.children ?? [])
    .map((child) => child.text ?? '')
    .join('')
    .trim();

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * extractPostHeadings — pulls the ordered `h2`/`h3` outline out of a post's
 * Portable Text `body`, for the length-triggered "On this page" rail
 * (`PostContentsRail`). Returns `[]` unless the body has at least
 * `MIN_H2_HEADINGS_FOR_RAIL` H2-style blocks — the single gate both this
 * function and its caller (`BlogPostPage`) rely on, so a non-empty result is
 * always render-worthy on its own. Each returned heading carries a stable,
 * URL-safe slug `id` (deduped with a `-2`/`-3`… suffix when two headings
 * share the same text) that `PortableTextRenderer` renders as the matching
 * heading's DOM `id`, so rail links and deep-links resolve to a real anchor.
 */
export const extractPostHeadings = (
  body: RichText | undefined,
): TPostHeading[] => {
  if (!body) return [];

  const rawHeadings = body
    .filter(isHeadingBlock)
    .map((block) => ({
      key: block._key,
      level: (block.style === 'h2' ? 2 : 3) as TPostHeadingLevel,
      text: blockText(block),
    }))
    .filter((heading) => heading.text.length > 0);

  const h2Count = rawHeadings.filter((heading) => heading.level === 2).length;
  if (h2Count < MIN_H2_HEADINGS_FOR_RAIL) return [];

  const slugCounts = new Map<string, number>();

  return rawHeadings.map(({ key, level, text }) => {
    const base = slugify(text) || 'section';
    const seen = slugCounts.get(base) ?? 0;
    slugCounts.set(base, seen + 1);
    const id = seen === 0 ? base : `${base}-${seen + 1}`;

    return { id, text, level, key };
  });
};
