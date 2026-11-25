import { PRESET_ID, type TPresetId } from '@shinefold/config';

export const PRESET_LABEL_KEY = {
  [PRESET_ID.CONSOLE]: 'console',
  [PRESET_ID.EDITORIAL]: 'editorial',
  [PRESET_ID.SHINEFOLD]: 'shinefold',
} as const satisfies Record<TPresetId, string>;
