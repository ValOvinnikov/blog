import { PRESET_ID } from '@shinefold/config';

export const SHINEFOLD_LIGHT_GLOBALS = { preset: PRESET_ID.SHINEFOLD };

export const SHINEFOLD_DARK_GLOBALS = {
  ...SHINEFOLD_LIGHT_GLOBALS,
  colorMode: 'dark',
};
