import { heroField } from '@blog/studio/schema-types/fields/hero-field/hero-field';
import { modulesField } from '@blog/studio/schema-types/fields/modules-field/modules-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { contentSchema } from '@blog/studio/schema-types/modules/content/content';
import { faqSchema } from '@blog/studio/schema-types/modules/faq/faq';
import { heroBlogSchema } from '@blog/studio/schema-types/modules/hero-blog/hero-blog';
import { postLatestSchema } from '@blog/studio/schema-types/modules/post-latest/post-latest';
import { postListSchema } from '@blog/studio/schema-types/modules/post-list/post-list';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/taxonomy-list/taxonomy-list';
import { Tag } from 'lucide-react';
import { defineType } from 'sanity';

export const tagTemplateSchema = defineType({
  name: 'template_tag',
  title: 'Tag Template',
  type: 'document',
  description: 'The hero and modules a Tag page shows.',
  icon: Tag,
  preview: {
    select: { title: 'title' },
  },
  fields: [
    titleField(),
    heroField({ allow: [heroBlogSchema.name] }),
    modulesField({
      extend: [
        postListSchema.name,
        postLatestSchema.name,
        taxonomyListSchema.name,
        contentSchema.name,
        faqSchema.name,
      ],
      once: [postListSchema.name],
    }),
  ],
});
