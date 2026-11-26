import { PRESET_ID, type TPresetId } from '@shinefold/config/constants';
import type { TMaybeNull } from '@shinefold/config/types';

import type { TPresetSurfaces } from './preset-surface-types';
import { SHINEFOLD_SURFACES } from './shinefold-surfaces';

export const PRESET_SURFACES: Record<TPresetId, TMaybeNull<TPresetSurfaces>> = {
  [PRESET_ID.CONSOLE]: null,
  [PRESET_ID.EDITORIAL]: null,
  [PRESET_ID.SHINEFOLD]: SHINEFOLD_SURFACES,
};
