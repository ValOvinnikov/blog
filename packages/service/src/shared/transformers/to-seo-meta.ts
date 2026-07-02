import type { InferFragmentType } from 'groqd';

import type { seoFragment } from '#/shared/fragments/seo';
import { buildImageUrl } from '#/shared/transformers/build-image-url';

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
    ogTitle: raw.ogTitle ?? undefined,
    ogDescription: raw.ogDescription ?? undefined,
    ogImageUrl: buildImageUrl(raw.ogImage),
  };
}
