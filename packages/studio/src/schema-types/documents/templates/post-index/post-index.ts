import { heroField } from '@blog/studio/schema-types/fields/hero-field/hero-field';
import { modulesField } from '@blog/studio/schema-types/fields/modules-field/modules-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { contentSchema } from '@blog/studio/schema-types/modules/content/content';
import { heroBlogSchema } from '@blog/studio/schema-types/modules/hero-blog/hero-blog';
import { postFeaturedSchema } from '@blog/studio/schema-types/modules/post-featured/post-featured';
import { postLatestSchema } from '@blog/studio/schema-types/modules/post-latest/post-latest';
import { postListSchema } from '@blog/studio/schema-types/modules/post-list/post-list';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/taxonomy-list/taxonomy-list';
import { Newspaper } from 'lucide-react';
import { defineType } from 'sanity';

export const postIndexTemplateSchema = defineType({
  name: 'template_postIndex',
  title: 'Post Index Template',
  type: 'document',
  description: 'The hero and modules the Post Index page shows.',
  icon: Newspaper,
  preview: {
    select: { title: 'title' },
  },
  fields: [
    titleField(),
    heroField({ allow: [heroBlogSchema.name] }),
    modulesField({
      extend: [
        postListSchema.name,
        postFeaturedSchema.name,
        taxonomyListSchema.name,
        contentSchema.name,
        postLatestSchema.name,
      ],
      once: [postListSchema.name],
    }),
  ],
});
