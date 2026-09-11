import type { TMaybeUndefined } from '@blog/config';
import type { TImageTenant } from '@blog/service/sanity/image';
import type { seoFragment } from '@blog/service/shared/fragments/seo';
import { buildImageUrl } from '@blog/service/shared/transformers/build-image-url';
import type { InferFragmentType } from 'groqd';

export type TRawSeo = InferFragmentType<typeof seoFragment>;

export type TSeoResolved = {
  title: string;
  description: TMaybeUndefined<string>;
  ogTitle: TMaybeUndefined<string>;
  ogDescription: TMaybeUndefined<string>;
  ogImageUrl: TMaybeUndefined<string>;
};

export function resolveSeo(
  authored: TRawSeo,
  tenant: TImageTenant,
): TSeoResolved {
  return {
    title: authored.metaTitle,
    description: authored.metaDescription ?? undefined,
    ogTitle: authored.openGraph?.ogTitle ?? undefined,
    ogDescription: authored.openGraph?.ogDescription ?? undefined,
    ogImageUrl: buildImageUrl(authored.openGraph?.ogImage, tenant),
  };
}
