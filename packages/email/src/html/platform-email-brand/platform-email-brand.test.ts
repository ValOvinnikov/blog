import {
  hexToOklch,
  renderedContrastRatio,
  WCAG_AA_CONTRAST_MIN,
} from '@shinefold/utils/color';

import {
  PLATFORM_EMAIL_BRAND,
  PLATFORM_EMAIL_DARK_BRAND,
} from './platform-email-brand';

function contrast(foreground: string, background: string): number {
  return renderedContrastRatio(hexToOklch(foreground), [
    hexToOklch(background),
  ]);
}

describe.each([
  ['light', PLATFORM_EMAIL_BRAND],
  ['dark', PLATFORM_EMAIL_DARK_BRAND],
])('the %s Shinefold email palette', (_mode, brand) => {
  it.each(['text', 'textMuted', 'warn', 'bad'] as const)(
    'keeps %s readable on the card and the usage box',
    (foreground) => {
      expect(contrast(brand[foreground], brand.surface)).toBeGreaterThanOrEqual(
        WCAG_AA_CONTRAST_MIN,
      );
      expect(
        contrast(brand[foreground], brand.surfaceHead),
      ).toBeGreaterThanOrEqual(WCAG_AA_CONTRAST_MIN);
    },
  );

  it('keeps button text readable on the button', () => {
    expect(
      contrast(brand.brandPrimaryContrast, brand.brandPrimarySolid),
    ).toBeGreaterThanOrEqual(WCAG_AA_CONTRAST_MIN);
  });
});
