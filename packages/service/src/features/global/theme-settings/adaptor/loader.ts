import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { themeSettingsQuery } from './query';
import { toThemeTokens } from './transformer';
import type { TThemeTokens } from './types';

export async function getTheme(
  tenant?: TTenantSanityContext,
): Promise<TThemeTokens> {
  const raw = await runQuery(themeSettingsQuery, {
    tenant,
    ...isr('theme-settings', tenant?.projectId),
  });
  return toThemeTokens(raw);
}
