import { IMAGE_LAYOUT, type IBodyImageBlock } from '@blog/config';
import type { TPortableTextBody } from '@blog/service';

export type TPortableTextSegment =
  | { kind: 'PROSE'; blocks: TPortableTextBody }
  | { kind: 'BREAKOUT'; block: IBodyImageBlock };

/**
 * Splits a Portable Text body into alternating PROSE and BREAKOUT
 * (`FULL_BLEED` `bodyImage`) runs, so `PostBody` can render each
 * `FULL_BLEED` image as a sibling of `Prose` rather than nested inside it.
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
