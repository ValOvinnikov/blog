import type { InferResultType } from 'groqd';
import type { ImageWithAlt } from '@blog/types';
import { buildImageUrl } from '#/shared/to-post-card';
import type { TNavItem, TSocialLink } from '#/shared/types';
import { siteSettingsQuery } from './query';

type TRawSiteSettings = NonNullable<InferResultType<typeof siteSettingsQuery>>;

export type TSiteSettings = {
  title: string;
  description: string | null;
  tagline: string | null;
  logoUrl: string | null;
  ogImageUrl: string | null;
  navigation: TNavItem[];
  socialLinks: TSocialLink[];
};

export function toSiteSettings(raw: TRawSiteSettings): TSiteSettings {
  return {
    title: raw.title ?? '',
    description: raw.description ?? null,
    tagline: raw.tagline ?? null,
    logoUrl: buildImageUrl(raw.logo as ImageWithAlt | null | undefined),
    ogImageUrl: buildImageUrl(raw.ogImage as ImageWithAlt | null | undefined),
    navigation: (raw.navigation ?? []).map((item) => ({
      label: item.label ?? '',
      href: item.href ?? '',
    })),
    socialLinks: (raw.socialLinks ?? []).map((link) => ({
      platform: link.platform ?? '',
      url: link.url ?? '',
    })),
  };
}
