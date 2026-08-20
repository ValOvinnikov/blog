import { Tags } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const topicSchema = defineType({
  name: 'blog_topic',
  title: 'Topic',
  type: 'document',
  icon: Tags,
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
