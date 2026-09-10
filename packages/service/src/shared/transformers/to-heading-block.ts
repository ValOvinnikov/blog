import type { TMaybeUndefined, THeadingBlock } from '@blog/config';
import type {
  headingBlockFragment,
  requiredHeadingBlockFragment,
} from '@blog/service/shared/fragments/heading-block';
import type { InferFragmentType } from 'groqd';

export type TRawHeadingBlock = InferFragmentType<typeof headingBlockFragment>;
export type TRawRequiredHeadingBlock = InferFragmentType<
  typeof requiredHeadingBlockFragment
>;

export type TRequiredHeadingBlock = {
  heading: string;
  supportingText: TMaybeUndefined<string>;
};

export function toHeadingBlock(
  raw: TRawHeadingBlock | null | undefined,
): THeadingBlock {
  return {
    heading: raw?.heading ?? undefined,
    supportingText: raw?.supportingText ?? undefined,
  };
}

export function toRequiredHeadingBlock(
  raw: TRawRequiredHeadingBlock,
): TRequiredHeadingBlock {
  return {
    heading: raw.heading,
    supportingText: raw.supportingText ?? undefined,
  };
}
