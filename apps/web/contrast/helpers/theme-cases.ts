import { PRESET_ID, type TPresetId } from '@blog/config/constants';

export type TSiteThemeGlobals = {
  preset: TPresetId;
  accentHue: string;
  colorMode: 'light' | 'dark';
};

export const COLOR_MODES: TSiteThemeGlobals['colorMode'][] = ['light', 'dark'];

const PRESET_HUE = 'PRESET';

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
  colorMode: 'light',
};

export const VIEWPORT_WIDTHS = [1280, 390];
