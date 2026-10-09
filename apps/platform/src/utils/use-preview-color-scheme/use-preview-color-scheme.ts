import { useState } from 'react';

export type TPreviewMode = 'light' | 'dark';

export const usePreviewColorScheme = () => {
  const [mode, setMode] = useState<TPreviewMode>('light');

  return { mode, setMode, isDark: mode === 'dark' };
};
