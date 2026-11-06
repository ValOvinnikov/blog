import type { InferResultType } from 'groqd';

import type { siteSettingsQuery } from './query';
import type { TSiteSettings } from './types';

export type TRawSiteSettings = NonNullable<
  InferResultType<typeof siteSettingsQuery>
>;

export function toSiteSettings(raw: TRawSiteSettings): TSiteSettings {
  return {
    currency: raw.currency,
  };
}
