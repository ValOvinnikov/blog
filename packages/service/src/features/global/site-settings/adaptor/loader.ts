import { isr, runQuery } from '#/sanity/query';

import { siteSettingsQuery } from './query';
import { toSiteSettings } from './transformer';
import type { TSiteSettings } from './types';

export async function getSiteSettings(): Promise<TSiteSettings> {
  const raw = await runQuery(siteSettingsQuery, isr('site-settings'));
  return toSiteSettings(raw);
}
