import { PAGE_TAG_TYPE } from '@blog/studio/schema-types/documents/pages/page-tag-type';
import { getDraftsClient } from '@blog/studio/schema-types/helpers/get-drafts-client';
import { slugField } from '@blog/studio/schema-types/helpers/slug-field';
import { seoSchema } from '@blog/studio/schema-types/objects/seo';
import { Tag } from 'lucide-react';
import {
  defineField,
  defineType,
  type SanityDocument,
  type ValidationContext,
} from 'sanity';

/**
 * Warns (does not block publishing) when no `page_tag` references this tag
 * — `/tags/{slug}` 404s with no runtime fallback in that state, so the
 * editor should see the gap on the document they'd fix it from.
 */
const validateHasPageTag = async (
  document: SanityDocument | undefined,
  context: ValidationContext,
): Promise<string | true> => {
  const publishedId = document?._id.replace(/^drafts\./, '');

  if (!publishedId) return true;

  const client = getDraftsClient(context);

  const referencingCount = await client.fetch<number>(
    `count(*[_type == $type && tag._ref == $tagId])`,
    { type: PAGE_TAG_TYPE, tagId: publishedId },
  );

  return referencingCount > 0
    ? true
    : 'No Tag Page references this tag yet — /tags/{slug} will 404 until one is created.';
};

export const tagSchema = defineType({
  name: 'blog_tag',
  title: 'Tag',
  type: 'document',
  icon: Tag,
  validation: (rule) => rule.custom(validateHasPageTag).warning(),
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Topic label shown on tag chips and the tag archive page.',
      validation: (rule) => rule.required().max(60),
    }),
    slugField({
      description:
        'URL path segment for the tag page — auto-generated from title.',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description:
        'Brief topic summary — shown on the tag archive page and used as its meta description.',
      validation: (rule) => rule.max(300),
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: seoSchema.name,
      description:
        'Override meta title, description, and OG image for search engines.',
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({ title }: { title?: string }) {
      return {
        title: title ?? 'Untitled',
      };
    },
  },
});
