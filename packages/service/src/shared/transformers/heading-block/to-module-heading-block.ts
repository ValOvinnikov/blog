import type { THeadingBlock, TMaybeUndefined } from '@shinefold/config';
import type { moduleHeadingBlockFragment } from '@shinefold/service/shared/fragments/heading-block/module-heading-block';
import type { InferFragmentType } from 'groqd';

import { toHeadingPieces } from './to-heading-pieces';

export type TRawModuleHeadingBlock = InferFragmentType<
  typeof moduleHeadingBlockFragment
>;

export function toModuleHeadingBlock(
  raw: TRawModuleHeadingBlock,
): THeadingBlock;
export function toModuleHeadingBlock(
  raw: TRawModuleHeadingBlock | null | undefined,
): TMaybeUndefined<THeadingBlock>;
export function toModuleHeadingBlock(
  raw: TRawModuleHeadingBlock | null | undefined,
): TMaybeUndefined<THeadingBlock> {
  if (!raw) return undefined;

  const headingPieces = toHeadingPieces(raw.heading);

  return {
    heading: headingPieces.map(({ text }) => text).join(''),
    headingPieces,
    supportingText: raw.supportingText ?? undefined,
  };
}
