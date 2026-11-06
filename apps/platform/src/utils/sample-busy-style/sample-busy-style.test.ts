import { BUSY_BUTTON_STYLE, SPINNER_STYLE } from '@blog/config';

import { toSampleBusyStyle } from './sample-busy-style';

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
