import { PAGE_HOME_TYPE } from '@blog/studio/schema-types/documents/pages/home/home-type';
import { heroField } from '@blog/studio/schema-types/fields/hero-field/hero-field';
import { modulesField } from '@blog/studio/schema-types/fields/modules-field/modules-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { contentSchema } from '@blog/studio/schema-types/modules/content/content';
import { ctaSchema } from '@blog/studio/schema-types/modules/cta/cta';
import { faqSchema } from '@blog/studio/schema-types/modules/faq/faq';
import { featureListSchema } from '@blog/studio/schema-types/modules/feature-list/feature-list';
import { heroBlogSchema } from '@blog/studio/schema-types/modules/hero-blog/hero-blog';
import { heroProfileSchema } from '@blog/studio/schema-types/modules/hero-profile/hero-profile';
import { heroStatementSchema } from '@blog/studio/schema-types/modules/hero-statement/hero-statement';
import { logoWallSchema } from '@blog/studio/schema-types/modules/logo-wall/logo-wall';
import { newsletterSchema } from '@blog/studio/schema-types/modules/newsletter/newsletter';
import { postFeaturedSchema } from '@blog/studio/schema-types/modules/post-featured/post-featured';
import { postLatestSchema } from '@blog/studio/schema-types/modules/post-latest/post-latest';
import { statsSchema } from '@blog/studio/schema-types/modules/stats/stats';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/taxonomy-list/taxonomy-list';
import { testimonialSchema } from '@blog/studio/schema-types/modules/testimonial/testimonial';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { seoField } from '@blog/studio/schema-types/objects/seo/seo-field';
import { House } from 'lucide-react';
import { defineType } from 'sanity';

export const homePageSchema = defineType({
  name: PAGE_HOME_TYPE,
  title: 'Home Page',
  type: 'document',
  description:
    'The home page — the first thing readers see, built from a hero, a heading, and a stack of modules.',
  icon: House,
  preview: {
    select: {
      title: 'title',
    },
    prepare({ title }) {
      return {
        title: title ?? 'Unknown',
        subtitle: 'Home singleton',
      };
    },
  },
  fields: [
    titleField(),
    headingBlockField(),
    heroField({
      allow: [
        heroBlogSchema.name,
        heroStatementSchema.name,
        heroProfileSchema.name,
      ],
    }),
    modulesField({
      allow: [
        contentSchema.name,
        ctaSchema.name,
        newsletterSchema.name,
        postLatestSchema.name,
        taxonomyListSchema.name,
        postFeaturedSchema.name,
        featureListSchema.name,
        logoWallSchema.name,
        testimonialSchema.name,
        statsSchema.name,
        faqSchema.name,
      ],
    }),
    seoField(),
  ],
});
