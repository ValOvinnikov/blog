import {
  COLOR_SCHEME,
  PRESET_ID,
  type TColorScheme,
  type TPresetId,
} from '@shinefold/config/constants';
import { SITE_THEME_HUE } from '@web/constants/site-theme';

export type TSiteThemeGlobals = {
  preset: TPresetId;
  accentHue: string;
  colorMode: TColorScheme;
};

export const COLOR_MODES = Object.values(COLOR_SCHEME);

const PRESET_HUE = SITE_THEME_HUE.FROM_PRESET;

// Hues 130 and 190 sit where the inspection found the accent ramp's worst light-mode failures.
export const THEME_CASES = [
  { name: 'console', preset: PRESET_ID.CONSOLE, accentHue: PRESET_HUE },
  { name: 'editorial', preset: PRESET_ID.EDITORIAL, accentHue: PRESET_HUE },
  { name: 'hue-130', preset: PRESET_ID.CONSOLE, accentHue: '130' },
  { name: 'hue-190', preset: PRESET_ID.CONSOLE, accentHue: '190' },
];

export const INITIAL_GLOBALS: TSiteThemeGlobals = {
  preset: PRESET_ID.CONSOLE,
  accentHue: PRESET_HUE,
  colorMode: COLOR_SCHEME.LIGHT,
};

export const VIEWPORT_WIDTHS = [1280, 390];
