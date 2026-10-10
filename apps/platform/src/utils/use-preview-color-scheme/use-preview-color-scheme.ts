import { PREVIEW_MODE, type TPreviewMode } from '@platform/constants/preview';
import { useState } from 'react';

export const usePreviewColorScheme = () => {
  const [mode, setMode] = useState<TPreviewMode>(PREVIEW_MODE.LIGHT);

  return { mode, setMode, isDark: mode === PREVIEW_MODE.DARK };
};
