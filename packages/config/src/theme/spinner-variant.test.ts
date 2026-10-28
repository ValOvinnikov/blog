import { PRESET_ID, SPINNER_STYLE } from '@blog/config/constants';

import { toSpinnerVariant } from './spinner-variant';

describe(toSpinnerVariant, () => {
  it.each([
    [PRESET_ID.CONSOLE, SPINNER_STYLE.BRAILLE],
    [PRESET_ID.EDITORIAL, SPINNER_STYLE.RING],
  ])(
    'resolves Follow the preset to the %s preset spinner, %s',
    (presetId, spinnerVariant) => {
      expect(toSpinnerVariant(SPINNER_STYLE.PRESET, presetId)).toBe(
        spinnerVariant,
      );
    },
  );

  it.each([
    SPINNER_STYLE.BRAILLE,
    SPINNER_STYLE.RING,
    SPINNER_STYLE.DOTS,
    SPINNER_STYLE.PULSE,
  ])('keeps a chosen %s spinner whatever the preset', (spinnerStyle) => {
    expect(toSpinnerVariant(spinnerStyle, PRESET_ID.EDITORIAL)).toBe(
      spinnerStyle,
    );
  });
});
