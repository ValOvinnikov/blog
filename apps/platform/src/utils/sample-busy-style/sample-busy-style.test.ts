import {
  BUSY_BUTTON_STYLE,
  PRESET_ID,
  SPINNER_STYLE,
  type TPresetId,
} from '@blog/config';

import { toSampleBusyStyle } from './sample-busy-style';

describe(toSampleBusyStyle, () => {
  it.each([
    { preset: PRESET_ID.CONSOLE, spinnerVariant: SPINNER_STYLE.BRAILLE },
    { preset: PRESET_ID.EDITORIAL, spinnerVariant: SPINNER_STYLE.RING },
  ] satisfies { preset: TPresetId; spinnerVariant: string }[])(
    'resolves the preset spinner for $preset',
    ({ preset, spinnerVariant }) => {
      const busy = toSampleBusyStyle({
        preset,
        busyButtonStyle: BUSY_BUTTON_STYLE.KEPT,
        spinnerStyle: SPINNER_STYLE.PRESET,
      });

      expect(busy).toEqual({
        busyStyle: BUSY_BUTTON_STYLE.KEPT,
        spinnerVariant,
      });
    },
  );

  it('keeps a chosen spinner whatever the preset', () => {
    const busy = toSampleBusyStyle({
      preset: PRESET_ID.CONSOLE,
      busyButtonStyle: BUSY_BUTTON_STYLE.LABEL,
      spinnerStyle: SPINNER_STYLE.DOTS,
    });

    expect(busy.spinnerVariant).toBe(SPINNER_STYLE.DOTS);
  });
});
