import type { InferResultType } from 'groqd';

import { buildImageUrl } from '#/shared/transformers/build-image-url';
import { toSocialLink } from '#/shared/transformers/to-social-link';

import type { siteSettingsQuery } from './query';
import type { TSiteSettings } from './types';

export type TRawSiteSettings = NonNullable<
  InferResultType<typeof siteSettingsQuery>
>;

export function toSiteSettings(raw: TRawSiteSettings): TSiteSettings {
  return {
    title: raw.title,
    description: raw.description,
    tagline: raw.tagline ?? undefined,
    brandPrefix: raw.brandPrefix,
    brandSuffix: raw.brandSuffix ?? undefined,
    logoUrl: buildImageUrl(raw.logo),
    ogImageUrl: buildImageUrl(raw.defaultSeo.ogImage),
    ogTitle: raw.defaultSeo.ogTitle ?? undefined,
    ogDescription: raw.defaultSeo.ogDescription ?? undefined,
    navigation: raw.navigation ?? [],
    socialLinks: (raw.socialLinks ?? []).map(toSocialLink),
  };
}
