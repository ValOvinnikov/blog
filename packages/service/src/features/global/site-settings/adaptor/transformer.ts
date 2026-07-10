import type { InferResultType } from 'groqd';

import { buildImageUrl } from '#/shared/transformers/build-image-url';

import type { siteSettingsQuery } from './query';
import type { TSiteSettings } from './types';

export type TRawSiteSettings = NonNullable<
  InferResultType<typeof siteSettingsQuery>
>;

export function toSiteSettings(raw: TRawSiteSettings): TSiteSettings {
  return {
    brand: {
      name: raw.brand.name,
      prefix: raw.brand.prefix,
      suffix: raw.brand.suffix ?? undefined,
      logoUrl: buildImageUrl(raw.brand.logo),
    },
    description: raw.description,
    tagline: raw.tagline ?? undefined,
    ogImageUrl: buildImageUrl(raw.defaultSeo.ogImage),
    ogTitle: raw.defaultSeo.ogTitle ?? undefined,
    ogDescription: raw.defaultSeo.ogDescription ?? undefined,
  };
}
