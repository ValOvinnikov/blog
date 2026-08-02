import { IMAGE_LAYOUT, type RichText } from '@blog/config';

type TBodyImageBlock = Extract<RichText[number], { _type: 'bodyImage' }>;

export type TPortableTextSegment =
  | { kind: 'PROSE'; blocks: RichText }
  | { kind: 'BREAKOUT'; block: TBodyImageBlock };

/**
 * segmentPortableTextBody — splits a Portable Text body into alternating
 * runs of ordinary blocks (`PROSE`) and standalone `FULL_BLEED` `bodyImage`
 * blocks (`BREAKOUT`), so `PortableTextRenderer` can keep every ordinary
 * block flowing through the same reading-measure-capped `Prose` wrapper it
 * always has, while a `FULL_BLEED` image renders as `Prose`'s own sibling —
 * free to fill the full width of whatever "breakout-safe" box contains both
 * (see `blog-post-page-variants.ts`'s `content` slot), with no viewport-
 * relative math needed. A body with no `FULL_BLEED` image collapses to a
 * single `PROSE` segment holding every block, in original order.
 */
export const segmentPortableTextBody = (
  value: RichText,
): TPortableTextSegment[] => {
  const segments: TPortableTextSegment[] = [];
  let run: RichText = [];

  const flushRun = () => {
    if (run.length > 0) {
      segments.push({ kind: 'PROSE', blocks: run });
      run = [];
    }
  };

  for (const block of value) {
    if (
      block._type === 'bodyImage' &&
      block.layout === IMAGE_LAYOUT.FULL_BLEED
    ) {
      flushRun();
      segments.push({ kind: 'BREAKOUT', block });
    } else {
      run.push(block);
    }
  }
  flushRun();

  return segments;
};
