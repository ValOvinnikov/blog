import type { seoFragment } from '@blog/service/shared/fragments/seo';
import { buildImageUrl } from '@blog/service/shared/transformers/build-image-url';
import type { InferFragmentType } from 'groqd';

export type TRawSeo = InferFragmentType<typeof seoFragment>;

export type TSeoMeta = {
  metaTitle: string;
  metaDescription: string | undefined;
  ogTitle: string | undefined;
  ogDescription: string | undefined;
  ogImageUrl: string | undefined;
};

export function toSeoMeta(raw: TRawSeo): TSeoMeta {
  return {
    metaTitle: raw.metaTitle,
    metaDescription: raw.metaDescription ?? undefined,
    ogTitle: raw.openGraph?.ogTitle ?? undefined,
    ogDescription: raw.openGraph?.ogDescription ?? undefined,
    ogImageUrl: buildImageUrl(raw.openGraph?.ogImage),
  };
}
