import type { THeadingBlock } from '@blog/config';
import type { headingBlockFragment } from '@blog/service/shared/fragments/heading-block';
import type { InferFragmentType } from 'groqd';

export type TRawHeadingBlock = InferFragmentType<typeof headingBlockFragment>;

export function toHeadingBlock(raw: TRawHeadingBlock): THeadingBlock {
  return {
    heading: raw.heading,
    supportingText: raw.supportingText ?? undefined,
  };
}
