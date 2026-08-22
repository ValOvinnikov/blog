import { PAGE_TOPIC_TYPE } from '@cms/schema-types/documents/pages/page-topic-type';
import { Tags } from 'lucide-react';
import {
  defineField,
  defineType,
  type SanityDocument,
  type ValidationContext,
} from 'sanity';

const HAS_PAGE_TOPIC_API_VERSION = '2024-01-01';

/**
 * Warns (does not block publishing) when no `page_topic` references this
 * topic — `/topics/{slug}` 404s with no runtime fallback in that state, so
 * the editor should see the gap on the document they'd fix it from.
 */
async function validateHasPageTopic(
  document: SanityDocument | undefined,
  context: ValidationContext,
): Promise<string | true> {
  const publishedId = document?._id.replace(/^drafts\./, '');

  if (!publishedId) return true;

  const client = context
    .getClient({ apiVersion: HAS_PAGE_TOPIC_API_VERSION })
    .withConfig({ perspective: 'drafts' });

  const referencingCount = await client.fetch<number>(
    `count(*[_type == $type && topic._ref == $topicId])`,
    { type: PAGE_TOPIC_TYPE, topicId: publishedId },
  );

  return referencingCount > 0
    ? true
    : 'No Topic Page references this topic yet — /topics/{slug} will 404 until one is created.';
}

export const topicSchema = defineType({
  name: 'blog_topic',
  title: 'Topic',
  type: 'document',
  icon: Tags,
  validation: (rule) => rule.custom(validateHasPageTopic).warning(),
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Topic name shown in filters and navigation.',
      validation: (rule) => rule.required().max(60),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description:
        'URL path segment for the topic page — auto-generated from title.',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description:
        'Brief explanation of what this topic covers, shown on the topic page.',
      validation: (rule) => rule.max(300),
    }),
  ],
});
