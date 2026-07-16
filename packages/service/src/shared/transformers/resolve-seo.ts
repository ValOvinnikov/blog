import type { seoFragment } from '@blog/service/shared/fragments/seo';
import { buildImageUrl } from '@blog/service/shared/transformers/build-image-url';
import type { InferFragmentType } from 'groqd';

export type TRawSeo = InferFragmentType<typeof seoFragment>;

export type TSeoResolved = {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  // Optional: bottoms out at the site-settings default OG image, but
  // `buildImageUrl` can legitimately yield `undefined` (missing asset /
  // url builder throws), so consumers must degrade gracefully (omit the
  // image) rather than emit `og:image` with no URL.
  ogImageUrl: string | undefined;
};

type TSeoContentDefaults = {
  title: string;
  description?: string;
  imageUrl?: string;
};

type TSeoSettingsDefaults = {
  description: string;
  defaultOgImageUrl: string | undefined;
};

/**
 * Resolves a page's SEO metadata through the fallback ladder
 * authored → content-derived → site defaults, applied once per field.
 */
export function resolveSeo(
  authored: TRawSeo | undefined,
  content: TSeoContentDefaults,
  settings: TSeoSettingsDefaults,
): TSeoResolved {
  const title = authored?.metaTitle ?? content.title;
  const description =
    authored?.metaDescription ?? content.description ?? settings.description;

  return {
    title,
    description,
    ogTitle: authored?.openGraph?.ogTitle ?? title,
    ogDescription: authored?.openGraph?.ogDescription ?? description,
    ogImageUrl:
      buildImageUrl(authored?.openGraph?.ogImage) ??
      content.imageUrl ??
      settings.defaultOgImageUrl,
  };
}
