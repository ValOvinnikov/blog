import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import { newsletterSettingsQuery } from './query';
import { toNewsletterSettings } from './transformer';
import type { TNewsletterSettings } from './types';

export async function getNewsletterSettings(
  tenant: TTenantSanityContext,
): Promise<TNewsletterSettings> {
  const raw = await runQuery(newsletterSettingsQuery, {
    tenant,
    ...isr('newsletter-settings', tenant.projectId),
  });
  return toNewsletterSettings(raw);
}
