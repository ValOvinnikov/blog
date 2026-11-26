import type { THeadingPiece } from '@shinefold/config';

export const MOCK_HIGHLIGHTED_PHRASE = 'live in minutes';

export const MOCK_SECOND_HIGHLIGHTED_PHRASE = 'your team';

export const MOCK_ONE_HIGHLIGHT_PIECES: readonly THeadingPiece[] = [
  { text: 'Go ', isHighlighted: false },
  { text: MOCK_HIGHLIGHTED_PHRASE, isHighlighted: true },
  { text: ' with a site that is yours', isHighlighted: false },
];

export const MOCK_TWO_HIGHLIGHT_PIECES: readonly THeadingPiece[] = [
  { text: 'Go ', isHighlighted: false },
  { text: MOCK_HIGHLIGHTED_PHRASE, isHighlighted: true },
  { text: ' and grow with ', isHighlighted: false },
  { text: MOCK_SECOND_HIGHLIGHTED_PHRASE, isHighlighted: true },
];

export const toHeadingWords = (pieces: readonly THeadingPiece[]) =>
  pieces.map(({ text }) => text).join('');
