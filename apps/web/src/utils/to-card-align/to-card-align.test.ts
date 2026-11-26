import { CONTENT_ALIGNMENT } from '@shinefold/config';

import { toCardAlign, toCenterOrLeftAlignment } from './to-card-align';

describe(toCardAlign, () => {
  it('centres a centred card', () => {
    expect(toCardAlign(CONTENT_ALIGNMENT.CENTER)).toBe('center');
  });

  it.each([CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.RIGHT, undefined])(
    'aligns a %s card left',
    (alignment) => {
      expect(toCardAlign(alignment)).toBe('left');
    },
  );
});

describe(toCenterOrLeftAlignment, () => {
  it('keeps a centred alignment', () => {
    expect(toCenterOrLeftAlignment(CONTENT_ALIGNMENT.CENTER)).toBe(
      CONTENT_ALIGNMENT.CENTER,
    );
  });

  it.each([CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.RIGHT, undefined])(
    'falls back to left for %s',
    (alignment) => {
      expect(toCenterOrLeftAlignment(alignment)).toBe(CONTENT_ALIGNMENT.LEFT);
    },
  );
});
