import { BUSY_BUTTON_STYLE, SPINNER_STYLE } from '@blog/config';

import { hasBusySpinner, toSampleBusyStyle } from './sample-busy-style';

describe(toSampleBusyStyle, () => {
  it('draws the busy style and the stored spinner', () => {
    const busy = toSampleBusyStyle({
      busyButtonStyle: BUSY_BUTTON_STYLE.KEPT,
      spinnerStyle: SPINNER_STYLE.DOTS,
    });

    expect(busy).toEqual({
      busyStyle: BUSY_BUTTON_STYLE.KEPT,
      spinnerVariant: SPINNER_STYLE.DOTS,
    });
  });
});

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
