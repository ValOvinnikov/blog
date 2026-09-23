import { PAGE_TAG_TYPE } from '@blog/studio/schema-types/documents/pages/tag/tag-type';
import { slugField } from '@blog/studio/schema-types/fields/slug-field/slug-field';
import { validateHasPage } from '@blog/studio/schema-types/validation/validate-has-page/validate-has-page';
import { Tag } from 'lucide-react';
import { defineField, defineType } from 'sanity';

const MISSING_PAGE_ERROR =
  'No Tag Page references this tag yet — /tags/{slug} will 404 until one is created.';

export const tagSchema = defineType({
  name: 'blog_tag',
  title: 'Tag',
  type: 'document',
  description:
    'A keyword used to label posts, powering tag chips, related posts, and the tag archive page.',
  icon: Tag,
  validation: (rule) =>
    rule.custom(validateHasPage(PAGE_TAG_TYPE, 'tag', MISSING_PAGE_ERROR)),
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
