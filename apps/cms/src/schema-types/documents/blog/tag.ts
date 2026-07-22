import { seoSchema } from '@cms/schema-types/objects/seo';
import { Tag } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const tagSchema = defineType({
  name: 'blog_tag',
  title: 'Tag',
  type: 'document',
  icon: Tag,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Topic label shown on tag chips and the tag archive page.',
      validation: (rule) => rule.required().max(60),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description:
        'URL path segment for the tag page — auto-generated from title.',
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
