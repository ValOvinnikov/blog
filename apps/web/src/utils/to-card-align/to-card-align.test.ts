import { CONTENT_ALIGNMENT } from '@shinefold/config';

import { toCardAlign } from './to-card-align';

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
