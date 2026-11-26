import { COLOR_SCHEME, PRESET_ID } from '@shinefold/config';

export const DARK_GLOBALS = { colorMode: COLOR_SCHEME.DARK };

export const SHINEFOLD_LIGHT_GLOBALS = { preset: PRESET_ID.SHINEFOLD };

export const SHINEFOLD_DARK_GLOBALS = {
  ...SHINEFOLD_LIGHT_GLOBALS,
  ...DARK_GLOBALS,
};
