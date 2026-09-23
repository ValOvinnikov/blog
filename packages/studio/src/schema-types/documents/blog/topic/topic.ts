import { PAGE_TOPIC_TYPE } from '@blog/studio/schema-types/documents/pages/topic/topic-type';
import { slugField } from '@blog/studio/schema-types/fields/slug-field/slug-field';
import { validateHasPage } from '@blog/studio/schema-types/validation/validate-has-page/validate-has-page';
import { Tags } from 'lucide-react';
import { defineField, defineType } from 'sanity';

const MISSING_PAGE_ERROR =
  'No Topic Page references this topic yet — /topics/{slug} will 404 until one is created.';

export const topicSchema = defineType({
  name: 'blog_topic',
  title: 'Topic',
  type: 'document',
  description:
    'A subject category used to classify posts, powering topic filters and the topic archive page.',
  icon: Tags,
  validation: (rule) =>
    rule.custom(validateHasPage(PAGE_TOPIC_TYPE, 'topic', MISSING_PAGE_ERROR)),
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Topic name shown in filters and navigation.',
      validation: (rule) => rule.required().max(60),
    }),
    slugField({
      description:
        'URL path segment for the topic page — auto-generated from title.',
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
