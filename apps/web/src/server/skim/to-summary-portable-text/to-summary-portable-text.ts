import type { TPostSummary } from '@shinefold/config';
import { hasLength } from '@shinefold/utils/primitives';
import {
  SUMMARY_BLOCK_STYLE,
  type TSummaryBlockStyle,
} from '@web/constants/generate-skim';

export type TGeneratedSummaryBlock = {
  style: TSummaryBlockStyle;
  text: string;
};

type TSummaryBlock = TPostSummary[number];
type TSummarySpan = NonNullable<TSummaryBlock['children']>[number];

const STRONG_MARK = 'strong';
const EM_MARK = 'em';
const STRONG_DELIMITER = '**';
const EM_DELIMITER = '*';
const INLINE_MARK = /(\*\*[^*]+\*\*|\*[^*]+\*)/;

const LIST_ITEM: Record<TSummaryBlockStyle, TSummaryBlock['listItem']> = {
  [SUMMARY_BLOCK_STYLE.PARAGRAPH]: undefined,
  [SUMMARY_BLOCK_STYLE.BULLET]: 'bullet',
  [SUMMARY_BLOCK_STYLE.NUMBER]: 'number',
};

const toMarkedSpan = (segment: string): Omit<TSummarySpan, '_key'> => {
  const isStrong = segment.startsWith(STRONG_DELIMITER);
  const delimiter = isStrong ? STRONG_DELIMITER : EM_DELIMITER;

  return {
    _type: 'span',
    text: segment.slice(delimiter.length, -delimiter.length),
    marks: [isStrong ? STRONG_MARK : EM_MARK],
  };
};

// Splitting on a capturing pattern puts every marked segment at an odd index.
const toSpans = (text: string, blockKey: string): TSummarySpan[] =>
  text
    .trim()
    .split(INLINE_MARK)
    .map((segment, index) =>
      index % 2 === 1
        ? toMarkedSpan(segment)
        : { _type: 'span' as const, text: segment, marks: [] },
    )
    .filter(({ text: spanText }) => hasLength(spanText))
    .map((span, index) => ({ ...span, _key: `${blockKey}-${String(index)}` }));

const toBlock = (
  { style, text }: TGeneratedSummaryBlock,
  index: number,
): TSummaryBlock => {
  const blockKey = `summary-${String(index)}`;
  const listItem = LIST_ITEM[style];

  return {
    _type: 'block',
    _key: blockKey,
    style: 'normal',
    markDefs: null,
    ...(listItem && { listItem, level: 1 }),
    children: toSpans(text, blockKey),
  };
};

export const toSummaryPortableText = (
  blocks: readonly TGeneratedSummaryBlock[],
): TPostSummary => blocks.map(toBlock);
