import { isr, runQuery } from '@blog/service/sanity/query';

import { themeSettingsQuery } from './query';
import { toThemeTokens } from './transformer';
import type { TThemeTokens } from './types';

export async function getTheme(): Promise<TThemeTokens> {
  const raw = await runQuery(themeSettingsQuery, isr('theme-settings'));
  return toThemeTokens(raw);
}
