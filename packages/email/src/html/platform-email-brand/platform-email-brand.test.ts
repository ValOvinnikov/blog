import { hexContrast } from '@shinefold/email/testing/hex-contrast';
import { WCAG_AA_CONTRAST_MIN } from '@shinefold/utils/color';
import { SHINEFOLD_LOGO_COLOR } from '@shinefold/utils/shinefold-logo';

import {
  PLATFORM_EMAIL_BRAND,
  PLATFORM_EMAIL_DARK_BRAND,
} from './platform-email-brand';

describe.each([
  ['light', PLATFORM_EMAIL_BRAND],
  ['dark', PLATFORM_EMAIL_DARK_BRAND],
])('the %s Shinefold email palette', (_mode, brand) => {
  it.each(['text', 'textMuted', 'warn', 'bad'] as const)(
    'keeps %s readable on the card and the usage box',
    (foreground) => {
      expect(
        hexContrast(brand[foreground], brand.surface),
      ).toBeGreaterThanOrEqual(WCAG_AA_CONTRAST_MIN);
      expect(
        hexContrast(brand[foreground], brand.surfaceHead),
      ).toBeGreaterThanOrEqual(WCAG_AA_CONTRAST_MIN);
    },
  );
});

it("keeps the light palette's button text readable on its button", () => {
  expect(
    hexContrast(
      PLATFORM_EMAIL_BRAND.brandPrimaryContrast,
      PLATFORM_EMAIL_BRAND.brandPrimarySolid,
    ),
  ).toBeGreaterThanOrEqual(WCAG_AA_CONTRAST_MIN);
});

it("keeps the owner limit button's ink readable on its yellow fill", () => {
  expect(
    hexContrast(SHINEFOLD_LOGO_COLOR.INK, SHINEFOLD_LOGO_COLOR.YELLOW),
  ).toBeGreaterThanOrEqual(WCAG_AA_CONTRAST_MIN);
});
