import type { TValueOf } from '@blog/config/utils';

export const PRESET_PICKER_LAYOUT = {
  RESPONSIVE: 'RESPONSIVE',
  PAIRED: 'PAIRED',
} as const;

export type TPresetPickerLayout = TValueOf<typeof PRESET_PICKER_LAYOUT>;
