import {
  isAccentHueAccessible,
  PRESET_ID,
  PRESET_REGISTRY,
  type TThemeTokens,
} from '@blog/config';
import type { InferResultType } from 'groqd';

import type { themeSettingsQuery } from './query';

export type TRawThemeSettings = InferResultType<typeof themeSettingsQuery>;

export function toThemeTokens(raw: TRawThemeSettings): TThemeTokens {
  const preset = raw?.preset ?? PRESET_ID.CONSOLE;
  const base = PRESET_REGISTRY[preset].themeTokens;

  const requestedAccentHue = raw?.accentHue ?? base.accentHue;
  // A tenant override that fails AA falls back to the preset's own accentHue,
  // so an inaccessible tint never ships.
  const accentHue = isAccentHueAccessible(requestedAccentHue)
    ? requestedAccentHue
    : base.accentHue;

  return {
    accentHue,
    logoHue: raw?.logoHue ?? base.logoHue ?? accentHue,
    headingFont: raw?.headingFont ?? base.headingFont,
    bodyFont: raw?.bodyFont ?? base.bodyFont,
    radiusScale: raw?.radiusScale ?? base.radiusScale,
    density: raw?.density ?? base.density,
    chromeOn: base.chromeOn,
  };
}
