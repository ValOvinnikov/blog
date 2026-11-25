import type { THeadingPiece, TMaybeNull } from '@shinefold/config';
import { HEADING_TEXT_MARK } from '@shinefold/config/constants';
import { hasLength } from '@shinefold/utils/primitives';

type THeadingSourceBlock = {
  children?: TMaybeNull<
    ReadonlyArray<{
      text?: TMaybeNull<string>;
      marks?: TMaybeNull<readonly string[]>;
    }>
  >;
};

const BLOCK_SEPARATOR: THeadingPiece = { text: ' ', isHighlighted: false };

function toBlockPieces({ children }: THeadingSourceBlock): THeadingPiece[] {
  return (children ?? []).map(({ text, marks }) => ({
    text: text ?? '',
    isHighlighted: (marks ?? []).includes(HEADING_TEXT_MARK.HIGHLIGHT),
  }));
}

function appendPiece(
  pieces: THeadingPiece[],
  piece: THeadingPiece,
): THeadingPiece[] {
  const previous = pieces.at(-1);

  return previous?.isHighlighted === piece.isHighlighted
    ? [
        ...pieces.slice(0, -1),
        { ...previous, text: previous.text + piece.text },
      ]
    : [...pieces, piece];
}

export function toHeadingPieces(
  blocks: readonly THeadingSourceBlock[],
): THeadingPiece[] {
  return blocks
    .flatMap((block, index) => [
      ...(index > 0 ? [BLOCK_SEPARATOR] : []),
      ...toBlockPieces(block),
    ])
    .filter(({ text }) => hasLength(text))
    .reduce(appendPiece, []);
}
