import { isr, runQuery } from '@blog/service/sanity/query';

import { newsletterSettingsQuery } from './query';
import { toNewsletterSettings } from './transformer';
import type { TNewsletterSettings } from './types';

export async function getNewsletterSettings(): Promise<TNewsletterSettings> {
  const raw = await runQuery(
    newsletterSettingsQuery,
    isr('newsletter-settings'),
  );
  return toNewsletterSettings(raw);
}
