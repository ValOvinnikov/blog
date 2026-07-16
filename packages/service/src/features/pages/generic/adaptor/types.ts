import type { TModule } from '@blog/service/shared/transformers/to-module';

// Unresolved authored SEO overrides — the generic page route (`/{slug}`)
// adopts `resolveSeo` when it is built (out of scope for #355, per design doc).
export type TGenericPageSeo = {
  metaTitle: string | undefined;
  metaDescription: string | undefined;
  ogTitle: string | undefined;
  ogDescription: string | undefined;
  ogImageUrl: string | undefined;
};

export type TGenericPage = {
  title: string;
  slug: string;
  modules: TModule[];
  seo: TGenericPageSeo | undefined;
};
