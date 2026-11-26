import type { THeadingBlock, THeadingPiece } from '@shinefold/config';

export type THeadingText = Pick<THeadingBlock, 'heading' | 'headingPieces'>;

export const resolveHeadingPieces = ({
  heading,
  headingPieces,
}: THeadingText): readonly THeadingPiece[] =>
  headingPieces?.length
    ? headingPieces
    : [{ text: heading, isHighlighted: false }];
