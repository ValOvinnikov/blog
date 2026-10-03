import type { THeadingBlock } from '@blog/config';
import type { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';
import type { InferFragmentType } from 'groqd';

export type TRawHeadingBlock = InferFragmentType<typeof headingBlockFragment>;

type TRawHeadingBlockInput = {
  heading: string | null;
  supportingText: string | null;
};

export function toHeadingBlock(raw: TRawHeadingBlockInput): THeadingBlock {
  return {
    heading: raw.heading ?? '',
    supportingText: raw.supportingText ?? undefined,
  };
}
