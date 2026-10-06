import type { THeadingBlock, TMaybeUndefined } from '@blog/config';
import type { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';
import type { InferFragmentType } from 'groqd';

export type TRawHeadingBlock = InferFragmentType<typeof headingBlockFragment>;

export function toHeadingBlock(raw: TRawHeadingBlock): THeadingBlock;
export function toHeadingBlock(
  raw: TRawHeadingBlock | null | undefined,
): TMaybeUndefined<THeadingBlock>;
export function toHeadingBlock(
  raw: TRawHeadingBlock | null | undefined,
): TMaybeUndefined<THeadingBlock> {
  if (!raw) return undefined;

  return {
    heading: raw.heading,
    supportingText: raw.supportingText ?? undefined,
  };
}
