import { PRESET_ID, type TPresetId } from '@blog/config';

export const PRESET_LABEL_KEY = {
  [PRESET_ID.CONSOLE]: 'console',
  [PRESET_ID.EDITORIAL]: 'editorial',
} as const satisfies Record<TPresetId, string>;
