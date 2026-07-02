import { q } from '#/sanity/query';

export const seoFragment = q.fragmentForType<'seo'>().project({
  metaTitle: true,
  metaDescription: true,
  ogImage: true,
});
