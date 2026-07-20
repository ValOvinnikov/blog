import { buildImageUrl } from '@blog/service/shared/transformers/build-image-url';
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
      prefix: raw.brand.prefix,
      suffix: raw.brand.suffix ?? undefined,
      specLine: raw.brand.specLine ?? undefined,
      logoUrl: buildImageUrl(raw.brand.logo),
      variant: raw.brand.variant,
    },
    description: raw.description,
    tagline: raw.tagline ?? undefined,
    defaultOgImageUrl: buildImageUrl(raw.defaultOgImage),
  };
}
