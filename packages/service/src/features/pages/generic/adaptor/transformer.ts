import { buildImageUrl } from '@blog/service/shared/transformers/build-image-url';
import { toModule } from '@blog/service/shared/transformers/to-module';
import type { InferResultType } from 'groqd';

import type { genericPageQuery } from './query';
import type { TGenericPage, TGenericPageSeo } from './types';

export type TRawGenericPage = InferResultType<typeof genericPageQuery>;

// TODO: replace with resolveSeo once the generic page route adopts the
// authored → content-derived → site-defaults ladder (out of scope for #355).
function toGenericPageSeo(
  raw: NonNullable<TRawGenericPage['seo']>,
): TGenericPageSeo {
  return {
    metaTitle: raw.metaTitle ?? undefined,
    metaDescription: raw.metaDescription ?? undefined,
    ogTitle: raw.openGraph?.ogTitle ?? undefined,
    ogDescription: raw.openGraph?.ogDescription ?? undefined,
    ogImageUrl: buildImageUrl(raw.openGraph?.ogImage),
  };
}

export function toGenericPage(raw: TRawGenericPage): TGenericPage {
  return {
    title: raw.title,
    slug: raw.slug,
    modules: (raw.modules ?? []).map(toModule),
    seo: raw.seo ? toGenericPageSeo(raw.seo) : undefined,
  };
}
