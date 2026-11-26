import { CONTENT_ALIGNMENT } from '@shinefold/config';

import { toCenterOrLeftAlignment } from './to-center-or-left-alignment';

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
