import { BUSY_BUTTON_STYLE } from '@blog/config';

import { hasBusySpinner } from './has-busy-spinner';

describe(hasBusySpinner, () => {
  it.each([BUSY_BUTTON_STYLE.LABEL, BUSY_BUTTON_STYLE.KEPT])(
    'is true for %s',
    (style) => {
      expect(hasBusySpinner(style)).toBe(true);
    },
  );

  it('is false for a progress edge', () => {
    expect(hasBusySpinner(BUSY_BUTTON_STYLE.EDGE)).toBe(false);
  });
});
