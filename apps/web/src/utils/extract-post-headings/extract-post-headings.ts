import type { TPortableText } from '@blog/config';
import type { TPortableTextBody } from '@blog/service';

/** A post needs at least this many H2 headings before a table-of-contents rail earns its place. */
export const MIN_H2_HEADINGS_FOR_RAIL = 3;

type TPostHeadingLevel = 2 | 3;

export type TPostHeading = {
  text: string;
  level: TPostHeadingLevel;
  key: string;
};

const isHeadingBlock = (
  node: TPortableTextBody[number],
): node is TPortableText & { style: 'h2' | 'h3' } =>
  node._type === 'block' && (node.style === 'h2' || node.style === 'h3');

const blockText = (block: TPortableText): string =>
  (block.children ?? [])
    .map((child) => child.text ?? '')
    .join('')
    .trim();

/**
 * Returns the ordered h2/h3 outline of a post body, gated to the same
 * threshold `BlogPostPage` uses so a non-empty result is always render-worthy.
 */
export const extractPostHeadings = (
  body: TPortableTextBody | undefined,
): TPostHeading[] => {
  if (!body) return [];

  const headings = body
    .filter(isHeadingBlock)
    .map((block) => ({
      key: block._key,
      level: (block.style === 'h2' ? 2 : 3) as TPostHeadingLevel,
      text: blockText(block),
    }))
    .filter((heading) => heading.text.length > 0);

  const h2Count = headings.filter((heading) => heading.level === 2).length;
  if (h2Count < MIN_H2_HEADINGS_FOR_RAIL) return [];

  return headings;
};
