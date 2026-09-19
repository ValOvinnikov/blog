import themeCss from '@blog/tailwind-config/theme.css?raw';

import {
  parseThemeTokens,
  type TCategory,
  type TToken,
} from './parse-theme-tokens';

export const tokensByCategory: Record<TCategory, TToken[]> = parseThemeTokens(
  themeCss,
).reduce(
  (acc, t) => {
    acc[t.category].push(t);
    return acc;
  },
  {
    color: [],
    typography: [],
    font: [],
    radius: [],
    spacing: [],
    layout: [],
    motion: [],
  } as Record<TCategory, TToken[]>,
);
