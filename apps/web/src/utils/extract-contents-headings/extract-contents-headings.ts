import type { TPortableTextBlock } from '@blog/config';
import type { TPortableTextBody } from '@blog/service';
import { hasLength } from '@blog/utils/primitives';

export const MIN_H2_HEADINGS_FOR_RAIL = 3;

type TContentsHeadingLevel = 2 | 3;

export type TContentsHeading = {
  text: string;
  level: TContentsHeadingLevel;
  key: string;
};

const isHeadingBlock = (
  node: TPortableTextBody[number],
): node is TPortableTextBlock & { style: 'h2' | 'h3' } =>
  node._type === 'block' && (node.style === 'h2' || node.style === 'h3');

const blockText = (block: TPortableTextBlock): string =>
  (block.children ?? [])
    .map((child) => child.text ?? '')
    .join('')
    .trim();

/** Returns an empty outline when the body has too few H2s to earn a contents rail. */
export const extractContentsHeadings = (
  body: TPortableTextBody | undefined,
): TContentsHeading[] => {
  if (!body) return [];

  const headings = body
    .filter(isHeadingBlock)
    .map((block) => ({
      key: block._key,
      level: (block.style === 'h2' ? 2 : 3) as TContentsHeadingLevel,
      text: blockText(block),
    }))
    .filter((heading) => hasLength(heading.text));

  const h2Count = headings.filter((heading) => heading.level === 2).length;
  if (h2Count < MIN_H2_HEADINGS_FOR_RAIL) return [];

  return headings;
};
