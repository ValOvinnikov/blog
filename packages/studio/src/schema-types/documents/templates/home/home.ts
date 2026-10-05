import { heroField } from '@blog/studio/schema-types/fields/hero-field/hero-field';
import { modulesField } from '@blog/studio/schema-types/fields/modules-field/modules-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { contentSchema } from '@blog/studio/schema-types/modules/content/content';
import { faqSchema } from '@blog/studio/schema-types/modules/faq/faq';
import { featureHighlightsSchema } from '@blog/studio/schema-types/modules/feature-highlights/feature-highlights';
import { featureListSchema } from '@blog/studio/schema-types/modules/feature-list/feature-list';
import { heroBlogSchema } from '@blog/studio/schema-types/modules/hero-blog/hero-blog';
import { heroProfileSchema } from '@blog/studio/schema-types/modules/hero-profile/hero-profile';
import { heroStatementSchema } from '@blog/studio/schema-types/modules/hero-statement/hero-statement';
import { logoWallSchema } from '@blog/studio/schema-types/modules/logo-wall/logo-wall';
import { postFeaturedSchema } from '@blog/studio/schema-types/modules/post-featured/post-featured';
import { postLatestSchema } from '@blog/studio/schema-types/modules/post-latest/post-latest';
import { pricingSchema } from '@blog/studio/schema-types/modules/pricing/pricing';
import { statsSchema } from '@blog/studio/schema-types/modules/stats/stats';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/taxonomy-list/taxonomy-list';
import { teamSchema } from '@blog/studio/schema-types/modules/team/team';
import { testimonialSchema } from '@blog/studio/schema-types/modules/testimonial/testimonial';
import { timelineSchema } from '@blog/studio/schema-types/modules/timeline/timeline';
import { House } from 'lucide-react';
import { defineType } from 'sanity';

export const homeTemplateSchema = defineType({
  name: 'template_home',
  title: 'Home Template',
  type: 'document',
  description: 'The hero and modules the Home page shows.',
  icon: House,
  preview: {
    select: { title: 'title' },
  },
  fields: [
    titleField(),
    heroField({
      allow: [
        heroBlogSchema.name,
        heroStatementSchema.name,
        heroProfileSchema.name,
      ],
    }),
    modulesField({
      extend: [
        contentSchema.name,
        postLatestSchema.name,
        taxonomyListSchema.name,
        postFeaturedSchema.name,
        featureListSchema.name,
        featureHighlightsSchema.name,
        logoWallSchema.name,
        testimonialSchema.name,
        teamSchema.name,
        statsSchema.name,
        timelineSchema.name,
        faqSchema.name,
        pricingSchema.name,
      ],
    }),
  ],
});
