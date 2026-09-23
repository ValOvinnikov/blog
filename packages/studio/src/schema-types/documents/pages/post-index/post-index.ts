import { PAGE_POST_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/post-index/post-index-type';
import { heroField } from '@blog/studio/schema-types/fields/hero-field/hero-field';
import { modulesField } from '@blog/studio/schema-types/fields/modules-field/modules-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { ctaSchema } from '@blog/studio/schema-types/modules/cta/cta';
import { heroBlogSchema } from '@blog/studio/schema-types/modules/hero-blog/hero-blog';
import { newsletterSchema } from '@blog/studio/schema-types/modules/newsletter/newsletter';
import { postFeaturedSchema } from '@blog/studio/schema-types/modules/post-featured/post-featured';
import { postListSchema } from '@blog/studio/schema-types/modules/post-list/post-list';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/taxonomy-list/taxonomy-list';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { seoField } from '@blog/studio/schema-types/objects/seo/seo-field';
import { Newspaper } from 'lucide-react';
import { defineType } from 'sanity';

export const postIndexPageSchema = defineType({
  name: PAGE_POST_INDEX_TYPE,
  title: 'Post Index Page',
  type: 'document',
  description:
    'The page that lists posts, built from a hero, a heading, and a stack of modules.',
  icon: Newspaper,
  preview: {
    select: {
      title: 'title',
    },
    prepare({ title }) {
      return {
        title: title ?? 'Unknown',
        subtitle: 'Blog singleton',
      };
    },
  },
  fields: [
    titleField(),
    headingBlockField(),
    heroField({ allow: [heroBlogSchema.name] }),
    modulesField({
      allow: [
        postListSchema.name,
        ctaSchema.name,
        newsletterSchema.name,
        postFeaturedSchema.name,
        taxonomyListSchema.name,
      ],
      once: [postListSchema.name],
    }),
    seoField(),
  ],
});
