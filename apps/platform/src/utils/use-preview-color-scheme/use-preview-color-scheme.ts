import {
  PREVIEW_MODE,
  PREVIEW_MODES,
  type TPreviewMode,
} from '@platform/constants/preview';
import { isUndefined } from '@shinefold/utils/primitives';
import { useState } from 'react';

export const usePreviewColorScheme = (lockedMode?: TPreviewMode) => {
  const [chosenMode, setMode] = useState<TPreviewMode>(PREVIEW_MODE.LIGHT);
  const mode = lockedMode ?? chosenMode;

  return {
    mode,
    modes: isUndefined(lockedMode) ? PREVIEW_MODES : [lockedMode],
    setMode,
    isDark: mode === PREVIEW_MODE.DARK,
  };
};
