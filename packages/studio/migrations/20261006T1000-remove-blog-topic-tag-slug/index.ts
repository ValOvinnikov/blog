import { at, defineMigration, unset } from 'sanity/migrate';

type TLegacySlugDoc = {
  slug?: unknown;
};

export const removeTaxonomySlug = (doc: TLegacySlugDoc) => {
  if (doc.slug === undefined) return undefined;

  return [at('slug', unset())];
};

export default defineMigration({
  title: 'Remove blog_topic and blog_tag slug',
  documentTypes: ['blog_topic', 'blog_tag'],
  migrate: {
    document(doc) {
      return removeTaxonomySlug(doc as TLegacySlugDoc);
    },
  },
});
