import { openGraphSchema } from '@blog/studio/schema-types/objects/open-graph/open-graph';
import { defineField, defineType } from 'sanity';

/** Must stay in sync with the backfill migration's own copy of these bounds. */
export const SEO_META_TITLE_MIN_LENGTH = 30;
export const SEO_META_TITLE_MAX_LENGTH = 60;

export const seoSchema = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  description:
    'The search-engine title and description for a page, plus its social-sharing preview.',
  options: { collapsible: true, collapsed: false },
  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Meta Title',
      type: 'string',
      description:
        "The page title shown in search results and browser tabs — distinct from the page's own on-page heading.",
      validation: (rule) =>
        rule
          .required()
          .min(SEO_META_TITLE_MIN_LENGTH)
          .max(SEO_META_TITLE_MAX_LENGTH),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'text',
      description:
        'The summary shown beneath the title in search results. Left empty, no summary is shown there.',
      validation: (rule) => rule.max(160),
    }),
    defineField({
      name: 'openGraph',
      title: 'Open Graph',
      type: openGraphSchema.name,
      description:
        'The social-sharing title, description, and image. Each is omitted entirely when empty.',
    }),
  ],
});
