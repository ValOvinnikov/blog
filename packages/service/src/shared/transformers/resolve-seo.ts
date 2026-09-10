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

/**
 * `seo.metaTitle` is required and validated in the schema, so a published
 * document should always carry one; a missing value signals unpublished or
 * otherwise invalid content, not an ordinary absence.
 */
export class MissingSeoTitleError extends Error {
  readonly code = 'SEO_META_TITLE_MISSING' as const;

  constructor() {
    super('seo.metaTitle is required but missing');
  }
}

export function resolveSeo(
  authored: TRawSeo | undefined,
  tenant: TImageTenant,
): TSeoResolved {
  if (!authored?.metaTitle) throw new MissingSeoTitleError();

  return {
    title: authored.metaTitle,
    description: authored.metaDescription ?? undefined,
    ogTitle: authored.openGraph?.ogTitle ?? undefined,
    ogDescription: authored.openGraph?.ogDescription ?? undefined,
    ogImageUrl: buildImageUrl(authored.openGraph?.ogImage, tenant),
  };
}
