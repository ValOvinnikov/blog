import { PRESET_ID, PRESET_REGISTRY, type TThemeTokens } from '@blog/config';
import type { InferResultType } from 'groqd';

import type { themeSettingsQuery } from './query';

export type TRawThemeSettings = InferResultType<typeof themeSettingsQuery>;

export function toThemeTokens(raw: TRawThemeSettings): TThemeTokens {
  const preset = raw?.preset ?? PRESET_ID.CONSOLE;
  const base = PRESET_REGISTRY[preset].themeTokens;

  const accentHue = raw?.accentHue ?? base.accentHue;

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
