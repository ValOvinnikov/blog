import { CARD_STYLE, COLOR_SCHEME } from '@blog/config/constants';

import { findContrastFailures } from './contrast-check';
import { KNOWN_CONTRAST_FAILURES } from './contrast-known-failures';
import { measureContrast } from './contrast-tokens';

const LIGHT_ACCENT_BAR = {
  scheme: COLOR_SCHEME.LIGHT,
  cardStyle: CARD_STYLE.ACCENT_BAR,
  hue: 250,
};

describe(findContrastFailures, () => {
  it('finds exactly the known failures across every hue, scheme and card style', () => {
    expect(findContrastFailures()).toEqual(KNOWN_CONTRAST_FAILURES);
  });
});

describe(measureContrast, () => {
  it('measures an alias as the token it points at', () => {
    expect(measureContrast('--ring', '--primary', LIGHT_ACCENT_BAR)).toBe(
      measureContrast('--brand-primary', '--primary', LIGHT_ACCENT_BAR),
    );
  });

  it('resolves the item accent colour from the card style', () => {
    expect(
      measureContrast('--item-accent-color', '--surface', {
        ...LIGHT_ACCENT_BAR,
        cardStyle: CARD_STYLE.OUTLINED,
      }),
    ).toBe(measureContrast('--border', '--surface', LIGHT_ACCENT_BAR));
  });

  it('measures the accent ramp at the hue it is given', () => {
    expect(
      measureContrast('--brand-primary', '--secondary', {
        ...LIGHT_ACCENT_BAR,
        hue: 190,
      }),
    ).toBeLessThan(
      measureContrast('--brand-primary', '--secondary', LIGHT_ACCENT_BAR),
    );
  });

  it('measures copy over a translucent scrim as composited over a white photo', () => {
    expect(
      measureContrast('--on-image', '--scrim-neutral-weak', LIGHT_ACCENT_BAR),
    ).toBeCloseTo(2.24, 2);
  });

  it('throws for a token with no registered value', () => {
    expect(() =>
      measureContrast('--unregistered', '--primary', LIGHT_ACCENT_BAR),
    ).toThrow('No LIGHT value registered for --unregistered');
  });
});
