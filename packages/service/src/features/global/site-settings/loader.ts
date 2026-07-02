import { runQuery, isr } from '#/sanity/query';
import { siteSettingsQuery } from './query';
import { toSiteSettings } from './transformer';
import type { TSiteSettings } from './transformer';

export type { TSiteSettings };

export async function getSiteSettings(): Promise<TSiteSettings | null> {
  const raw = await runQuery(siteSettingsQuery, isr('site-settings'));
  if (!raw) return null;
  return toSiteSettings(raw);
}
