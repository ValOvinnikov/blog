import type { TMaybeUndefined } from '@blog/config';
import type { TModule } from '@blog/service/shared/transformers/to-module';

// Unresolved authored SEO overrides — the generic page route (`/{slug}`)
// adopts `resolveSeo` when it is built (out of scope for #355, per design doc).
export type TGenericPageSeo = {
  metaTitle: TMaybeUndefined<string>;
  metaDescription: TMaybeUndefined<string>;
  ogTitle: TMaybeUndefined<string>;
  ogDescription: TMaybeUndefined<string>;
  ogImageUrl: TMaybeUndefined<string>;
};

export type TGenericPage = {
  title: string;
  slug: string;
  modules: TModule[];
  seo: TMaybeUndefined<TGenericPageSeo>;
};
