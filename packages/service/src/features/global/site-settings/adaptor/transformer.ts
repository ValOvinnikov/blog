import { toBrandTagline } from '@blog/service/shared/transformers/brand-tagline/to-brand-tagline';
import { toSanityImage } from '@blog/service/shared/transformers/image/to-sanity-image';
import type { InferResultType } from 'groqd';

import type { siteSettingsQuery } from './query';
import type { TSiteSettings } from './types';

export type TRawSiteSettings = NonNullable<
  InferResultType<typeof siteSettingsQuery>
>;

export function toSiteSettings(raw: TRawSiteSettings): TSiteSettings {
  return {
    brand: {
      name: raw.brand.name,
      tagline: toBrandTagline(raw.brand.tagline),
      logo: toSanityImage(raw.brand.logo),
    },
    currency: raw.currency,
  };
}
