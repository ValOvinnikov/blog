import {
  IMAGE_LAYOUT,
  type IBodyImageBlock,
  type TPortableTextBody,
} from '@blog/config';

export type TPortableTextSegment =
  | { kind: 'PROSE'; blocks: TPortableTextBody }
  | { kind: 'BREAKOUT'; block: IBodyImageBlock };

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
  value: TPortableTextBody,
): TPortableTextSegment[] => {
  const segments: TPortableTextSegment[] = [];
  let run: TPortableTextBody = [];

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
