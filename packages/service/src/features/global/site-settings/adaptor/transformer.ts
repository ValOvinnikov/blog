import { BRAND_TAGLINE_SEPARATOR_CHARS } from '@blog/config';
import { toSanityImage } from '@blog/service/shared/transformers/image/to-sanity-image/to-sanity-image';
import type { InferResultType } from 'groqd';

import type { siteSettingsQuery } from './query';
import type { TSiteSettings } from './types';

export type TRawSiteSettings = NonNullable<
  InferResultType<typeof siteSettingsQuery>
>;

export function toSiteSettings(raw: TRawSiteSettings): TSiteSettings {
  const taglineItems = raw.brand.tagline?.items ?? [];
  const taglineSeparator = raw.brand.tagline?.separator;
  const tagline =
    taglineItems.length && taglineSeparator
      ? taglineItems.join(
          ` ${BRAND_TAGLINE_SEPARATOR_CHARS[taglineSeparator]} `,
        )
      : undefined;

  return {
    brand: {
      name: raw.brand.name,
      tagline,
      logo: toSanityImage(raw.brand.logo),
    },
  };
}
